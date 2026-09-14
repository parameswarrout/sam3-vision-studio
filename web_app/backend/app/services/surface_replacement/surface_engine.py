import io
import time
import base64
from typing import Dict, Any, Optional, Tuple
import numpy as np
import cv2
from PIL import Image

from app.core import api_logger, sam3_service
from app.services.surface_replacement.stage1_segmentation import stage1_segmentation
from app.services.surface_replacement.stage2_geometry import stage2_geometry
from app.services.surface_replacement.stage3_intrinsic import stage3_intrinsic
from app.services.surface_replacement.stage4_materials import stage4_materials
from app.services.surface_replacement.stage5_relighting import stage5_relighting
from tests.evaluation.v5_metrics import (
    compute_iou,
    compute_boundary_f_score,
    compute_plane_reprojection_error,
    compute_masked_ssim,
    compute_unmasked_metrics
)

class PhysicallyBasedSurfaceEngineV5:
    """
    V5 Master Physically-Based Room Surface Replacement Engine.
    Orchestrates deterministic vision + graphics pipeline:
      [Stage 1] Multi-Prompt SAM 3 + Obstacle Carving + Alpha Matting + Geometry Feedback
      [Stage 2] Camera & 3D Geometry Fit (Depth -> 3D RANSAC Plane -> Orthonormal Metric UV)
      [Stage 3] Intrinsic Image Decomposition (Learned Albedo / Shading Illumination Field)
      [Stage 4] PBR Material Application (Metric Real-World Scaling & UV Lookup)
      [Stage 5] Cook-Torrance Relighting & Boundary-Only Seam Blending
    """

    def replace_surface(
        self,
        image_pil: Image.Image,
        tile_id: str = "mytyles_carrara_marble",
        surface_type: str = "floor",
        custom_prompt: Optional[str] = None,
        custom_mask_np: Optional[np.ndarray] = None,
        scale: float = 1.0,
        rotation_deg: float = 0.0,
        bump_strength: float = 1.0,
        grout_width_mm: float = 3.0,
        seam_blend_radius: int = 3,
        confidence: float = 0.15,
        apply_geometric_feedback: bool = True
    ) -> Dict[str, Any]:
        """
        Executes end-to-end Physically-Based Surface Replacement with full diagnostic breakdowns.
        """
        t_start = time.time()
        w, h = image_pil.size
        image_np = np.array(image_pil.convert("RGB"))

        timings = {}

        # -------------------------------------------------------------
        # STAGE 1: Surface Segmentation
        # -------------------------------------------------------------
        if custom_mask_np is not None and np.any(custom_mask_np):
            # Use user-supplied interactive mask
            bin_mask = custom_mask_np.astype(bool)
            alpha_matte, trimap = stage1_segmentation.compute_alpha_matting(
                image_np, bin_mask, band_radius=seam_blend_radius + 1
            )
            stage1_res = {
                "surface_type": surface_type,
                "binary_mask": bin_mask,
                "alpha_matte": alpha_matte,
                "trimap": trimap,
                "execution_time_ms": 0.0
            }
        else:
            stage1_res = stage1_segmentation.segment_surface(
                image_np=image_np,
                surface_type=surface_type,
                confidence=confidence,
                custom_prompt=custom_prompt
            )
        timings["stage1_segmentation_ms"] = stage1_res["execution_time_ms"]
        current_mask = stage1_res["binary_mask"]
        alpha_matte = stage1_res["alpha_matte"]

        if not np.any(current_mask):
            # No surface detected fallback
            buf = io.BytesIO()
            image_pil.save(buf, format="JPEG", quality=95)
            img_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")
            return {
                "rendered_image_base64": img_b64,
                "metrics": {
                    "boundary_f_score": 1.0,
                    "plane_reprojection_error_pct": 0.0,
                    "intrinsic_reconstruction_ssim": 1.0,
                    "unmasked_ssim": 1.0,
                    "unmasked_lpips": 0.0
                },
                "timings_ms": timings,
                "diagnostics": {}
            }

        # -------------------------------------------------------------
        # STAGE 2: Camera & Geometry Reconstruction
        # -------------------------------------------------------------
        stage2_res = stage2_geometry.reconstruct_geometry(
            image_pil=image_pil,
            image_np=image_np,
            surface_mask=current_mask,
            surface_type=surface_type,
            rotation_deg=rotation_deg
        )
        timings["stage2_geometry_ms"] = stage2_res["execution_time_ms"]

        # Geometric Consistency Feedback (Stage 1 & 2 interaction)
        if apply_geometric_feedback and len(stage2_res["points_3d"]) > 0:
            filtered_mask = stage1_segmentation.apply_geometric_consistency_filter(
                current_mask=current_mask,
                points_3d=stage2_res["points_3d"],
                plane_params=stage2_res["plane_params"],
                max_plane_distance_meters=0.15
            )
            if np.any(filtered_mask):
                current_mask = filtered_mask
                alpha_matte, _ = stage1_segmentation.compute_alpha_matting(
                    image_np, current_mask, band_radius=seam_blend_radius + 1
                )

        # Compute Plane Reprojection Error metric
        plane_err_pct = compute_plane_reprojection_error(
            points_3d=stage2_res["points_3d"],
            plane_params=stage2_res["plane_params"],
            intrinsics=stage2_res["intrinsics"],
            img_shape=(h, w)
        )

        # -------------------------------------------------------------
        # STAGE 3: Intrinsic Image Decomposition
        # -------------------------------------------------------------
        stage3_res = stage3_intrinsic.decompose(
            image_np=image_np,
            surface_mask=current_mask
        )
        timings["stage3_intrinsic_ms"] = stage3_res["execution_time_ms"]
        shading_field = stage3_res["shading_map"]
        intrinsic_ssim = stage3_res["reconstruction_ssim"]

        # -------------------------------------------------------------
        # STAGE 4: PBR Material Application & Metric UV
        # -------------------------------------------------------------
        pbr_material = stage4_materials.get_pbr_material(tile_id)
        stage4_res = stage4_materials.sample_material_on_uv(
            uv_map=stage2_res["uv_map"],
            surface_mask=current_mask,
            pbr_material=pbr_material,
            scale_multiplier=scale,
            grout_width_mm=grout_width_mm
        )
        timings["stage4_materials_ms"] = stage4_res["execution_time_ms"]

        # -------------------------------------------------------------
        # STAGE 5: Cook-Torrance Relighting & Compositing
        # -------------------------------------------------------------
        stage5_res = stage5_relighting.render_and_composite(
            original_img_np=image_np,
            surface_mask=current_mask,
            alpha_matte=alpha_matte,
            albedo_mapped=stage4_res["albedo_mapped"],
            micro_tangent_normal=stage4_res["normal_mapped"],
            roughness_mapped=stage4_res["roughness_mapped"],
            metalness_mapped=stage4_res["metalness_mapped"],
            shading_map=shading_field,
            dense_points_3d=stage2_res["dense_points_3d"],
            macro_normal=stage2_res["plane_normal"],
            surface_type=surface_type,
            bump_strength=bump_strength,
            seam_blend_radius=seam_blend_radius
        )
        timings["stage5_relighting_ms"] = stage5_res["execution_time_ms"]

        final_composite_np = stage5_res["composite_image"]

        # -------------------------------------------------------------
        # METRIC CALCULATIONS & QUALITY GATES
        # -------------------------------------------------------------
        # Unmasked SSIM and LPIPS (Primary Quality Gate)
        unmasked_ssim, unmasked_lpips = compute_unmasked_metrics(
            input_img=image_np,
            output_img=final_composite_np,
            surface_mask=current_mask
        )

        boundary_f1 = compute_boundary_f_score(current_mask, stage1_res["binary_mask"])
        mask_iou = compute_iou(current_mask, stage1_res["binary_mask"])

        metrics = {
            "boundary_f_score": round(boundary_f1, 4),
            "mask_iou": round(mask_iou, 4),
            "plane_reprojection_error_pct": round(plane_err_pct, 3),
            "intrinsic_reconstruction_ssim": round(intrinsic_ssim, 4),
            "unmasked_ssim": round(unmasked_ssim, 5),
            "unmasked_lpips": round(unmasked_lpips, 4),
            "quality_gates_passed": bool(
                plane_err_pct < 1.5 and
                intrinsic_ssim >= 0.97 and
                unmasked_ssim >= 0.995 and
                unmasked_lpips <= 0.02
            )
        }

        total_exec_ms = round((time.time() - t_start) * 1000, 2)
        timings["total_pipeline_ms"] = total_exec_ms

        # -------------------------------------------------------------
        # Base64 Stream Encoders
        # -------------------------------------------------------------
        # 1. Final Render Base64
        buf = io.BytesIO()
        Image.fromarray(final_composite_np).save(buf, format="JPEG", quality=95)
        rendered_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

        # 2. Diagnostics: UV Grid Overlay
        uv_vis = self._generate_uv_grid_visualization(stage2_res["uv_map"], current_mask, image_np)
        buf_uv = io.BytesIO()
        Image.fromarray(uv_vis).save(buf_uv, format="JPEG", quality=90)
        uv_vis_b64 = "data:image/jpeg;base64," + base64.b64encode(buf_uv.getvalue()).decode("ascii")

        # 3. Diagnostics: Normals RGB Map
        normal_vis = self._generate_normal_map_visualization(stage5_res["combined_normals"], current_mask)
        buf_norm = io.BytesIO()
        Image.fromarray(normal_vis).save(buf_norm, format="JPEG", quality=90)
        normal_vis_b64 = "data:image/jpeg;base64," + base64.b64encode(buf_norm.getvalue()).decode("ascii")

        # 4. Diagnostics: Shading Field Map
        shading_vis = np.clip(shading_field * 128.0, 0.0, 255.0).astype(np.uint8)
        buf_sh = io.BytesIO()
        Image.fromarray(shading_vis).save(buf_sh, format="JPEG", quality=90)
        shading_vis_b64 = "data:image/jpeg;base64," + base64.b64encode(buf_sh.getvalue()).decode("ascii")

        # 5. Diagnostics: Alpha Matte
        alpha_vis = (np.clip(alpha_matte, 0.0, 1.0) * 255.0).astype(np.uint8)
        buf_al = io.BytesIO()
        Image.fromarray(alpha_vis, mode="L").save(buf_al, format="PNG")
        alpha_vis_b64 = "data:image/png;base64," + base64.b64encode(buf_al.getvalue()).decode("ascii")

        api_logger.info(
            f"[SurfaceEngineV5] Replacement complete in {total_exec_ms}ms | Unmasked SSIM={unmasked_ssim:.5f} | Intrinsic SSIM={intrinsic_ssim:.4f} | Plane Error={plane_err_pct:.2f}%"
        )

        return {
            "rendered_image_base64": rendered_b64,
            "metrics": metrics,
            "timings_ms": timings,
            "plane_equation": {
                "a": float(stage2_res["plane_params"][0]),
                "b": float(stage2_res["plane_params"][1]),
                "c": float(stage2_res["plane_params"][2]),
                "d": float(stage2_res["plane_params"][3]),
                "normal": stage2_res["plane_normal"].tolist(),
                "inlier_ratio": float(stage2_res["inlier_ratio"])
            },
            "light_parameters": {
                "direction": stage5_res["light_dir"],
                "color": stage5_res["light_color"],
                "ambient": stage5_res["ambient_intensity"]
            },
            "diagnostics": {
                "uv_grid_base64": uv_vis_b64,
                "normal_map_base64": normal_vis_b64,
                "shading_field_base64": shading_vis_b64,
                "alpha_matte_base64": alpha_vis_b64
            }
        }

    def _generate_uv_grid_visualization(self, uv_map: np.ndarray, mask: np.ndarray, base_img: np.ndarray) -> np.ndarray:
        """Generates wireframe UV isometric grid overlay on the room photo."""
        vis = base_img.copy()
        u = uv_map[:, :, 0]
        v = uv_map[:, :, 1]

        # Draw grid lines every 0.30 meters
        grid_spacing = 0.30
        grid_u = (np.abs(np.mod(u, grid_spacing)) < 0.015) & mask
        grid_v = (np.abs(np.mod(v, grid_spacing)) < 0.015) & mask
        grid = grid_u | grid_v

        vis[grid] = [0, 255, 230]  # Bright cyan grid
        return vis

    def _generate_normal_map_visualization(self, normals: np.ndarray, mask: np.ndarray) -> np.ndarray:
        """Converts unit normal vectors in [-1, 1] to RGB [0, 255]."""
        h, w = normals.shape[:2]
        rgb_norm = (normals * 0.5 + 0.5) * 255.0
        vis = np.zeros((h, w, 3), dtype=np.uint8)
        vis[mask] = np.clip(rgb_norm[mask], 0, 255).astype(np.uint8)
        return vis

surface_engine_v5 = PhysicallyBasedSurfaceEngineV5()

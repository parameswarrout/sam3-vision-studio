import io
import time
import base64
import math
import numpy as np
import cv2
from PIL import Image
from typing import Dict, Any, Optional, Tuple

from app.core import api_logger
from app.v3_tile_visualizer.tile_catalog import get_tile_by_id, generate_tile_texture
from app.v3_tile_visualizer.vanishing_point_estimator import vanishing_point_estimator
from app.v3_tile_visualizer.pbr_material_engine import pbr_material_engine

class PerspectiveTileRendererV3:
    """
    V3.0 Photorealistic Neural Perspective & PBR Tile Projection & Blending System.
    Combines:
      1. RANSAC Architectural Vanishing Point & Baseboard Snapping
      2. PBR Micro-Surface Normal Bump Mapping & 3D Grout Crevices (AO)
      3. Schlick's Fresnel Specular Glint & Window Daylight Harvest
      4. 5 Selectable Blending Engines (Hybrid, Bilateral, Poisson, Intrinsic, Normal Depth)
    """

    def render_tiled_surface(
        self,
        original_img: Image.Image,
        mask: np.ndarray,
        tile_id: str,
        surface_type: str = "floor",
        scale: float = 1.0,
        rotation_deg: float = 0.0,
        perspective_strength: float = 0.65,
        shadow_retention: float = 0.75,
        grout_width: int = 2,
        grout_color: str = "#CBD5E1",
        glossiness: float = 0.5,
        blending_mode: str = "hybrid",
        auto_vanishing_point: bool = True,
        pbr_bump_strength: float = 0.50,
        fresnel_reflection_strength: float = 0.50,
        grout_crevice_depth: float = 0.40,
    ) -> Dict[str, Any]:
        t0 = time.time()
        w, h = original_img.size
        orig_np = np.array(original_img.convert("RGB"))

        if not np.any(mask):
            buf = io.BytesIO()
            original_img.save(buf, format="JPEG", quality=95)
            img_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")
            return {
                "rendered_image_base64": img_b64,
                "execution_time_ms": 0.0,
                "blending_mode": blending_mode,
                "auto_vanishing_point": auto_vanishing_point,
                "vanishing_point": None,
            }

        # 1. Fetch / Generate Tile Texture
        tile_info = get_tile_by_id(tile_id) or {}
        tex_img = generate_tile_texture(tile_id, size=512)
        tex_np = np.array(tex_img)

        # 2. Tile Repetition Grid
        base_tile_s = int(120 * scale)
        base_tile_s = max(24, min(base_tile_s, 600))
        tex_resized = cv2.resize(tex_np, (base_tile_s, base_tile_s), interpolation=cv2.INTER_LANCZOS4)

        # 3. Create Seamless Flat Repeated Canvas
        pad_factor = 2.2
        canvas_w = int(w * pad_factor)
        canvas_h = int(h * pad_factor)

        rep_x = (canvas_w // base_tile_s) + 2
        rep_y = (canvas_h // base_tile_s) + 2
        tiled_flat = np.tile(tex_resized, (rep_y, rep_x, 1))[:canvas_h, :canvas_w]

        # 4. Rotation
        if abs(rotation_deg) > 0.5:
            center = (canvas_w // 2, canvas_h // 2)
            rot_mat = cv2.getRotationMatrix2D(center, rotation_deg, 1.0)
            tiled_flat = cv2.warpAffine(
                tiled_flat, rot_mat, (canvas_w, canvas_h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP
            )

        # 5. Perspective Warp Projection (RANSAC Vanishing Point Snapping or Manual)
        detected_vp = None
        if auto_vanishing_point and surface_type.lower() == "floor":
            vp_res = vanishing_point_estimator.estimate_vanishing_point(orig_np, mask)
            detected_vp = list(vp_res["vp"])
            M = vanishing_point_estimator.compute_ransac_homography(
                canvas_w, canvas_h, w, h, vp_res["vp"], surface_type, perspective_strength
            )
            warped_tiles = cv2.warpPerspective(tiled_flat, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
        else:
            warped_tiles = self._apply_perspective_warp(
                tiled_flat, canvas_w, canvas_h, w, h, surface_type, perspective_strength
            )

        # 6. Apply PBR 3D Micro-Surface Normal Relief & 3D Grout Crevices
        if pbr_bump_strength > 0.05:
            warped_tiles = pbr_material_engine.apply_pbr_bump_relief(
                warped_tiles, bump_strength=pbr_bump_strength
            )
        if grout_crevice_depth > 0.05:
            warped_tiles = pbr_material_engine.apply_3d_grout_crevices(
                warped_tiles, grout_width=grout_width, crevice_depth=grout_crevice_depth
            )

        # 7. Apply Selected Blending Engine
        mode = blending_mode.lower().strip()
        if mode == "bilateral":
            modulated_np = self._render_bilateral_shading(
                orig_np, warped_tiles, mask, shadow_retention, glossiness
            )
        elif mode == "poisson":
            modulated_np = self._render_poisson_blending(
                orig_np, warped_tiles, mask, shadow_retention
            )
        elif mode == "intrinsic":
            modulated_np = self._render_intrinsic_decomposition(
                orig_np, warped_tiles, mask, shadow_retention, glossiness
            )
        elif mode == "normal_depth":
            modulated_np = self._render_normal_depth_shading(
                orig_np, warped_tiles, mask, surface_type, shadow_retention, glossiness
            )
        else: # "hybrid" (Default Master)
            modulated_np = self._render_hybrid_photoreal(
                orig_np, warped_tiles, mask, surface_type, shadow_retention, glossiness
            )

        # 8. Apply Schlick's Fresnel Window & Daylight Specular Harvest
        if fresnel_reflection_strength > 0.05 and surface_type.lower() == "floor":
            roughness = float(tile_info.get("roughness", 0.35))
            final_np = pbr_material_engine.harvest_window_fresnel_reflections(
                orig_np,
                modulated_np,
                mask,
                glossiness=glossiness,
                fresnel_strength=fresnel_reflection_strength,
                roughness=roughness,
            )
            final_np = self._alpha_composite(orig_np, final_np, mask)
        else:
            final_np = modulated_np

        # Convert to PIL Image & Base64
        rendered_pil = Image.fromarray(final_np, mode="RGB")
        buf = io.BytesIO()
        rendered_pil.save(buf, format="JPEG", quality=95, optimize=True)
        img_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

        exec_ms = round((time.time() - t0) * 1000, 1)
        api_logger.info(
            f"[V3 TileRenderer] Rendered '{tile_id}' using engine '{mode}' on {surface_type} in {exec_ms}ms"
        )

        return {
            "rendered_image_base64": img_b64,
            "rendered_pil": rendered_pil,
            "execution_time_ms": exec_ms,
            "blending_mode": mode,
            "auto_vanishing_point": auto_vanishing_point,
            "vanishing_point": detected_vp,
        }

    def _apply_perspective_warp(
        self, tiled_flat: np.ndarray, canvas_w: int, canvas_h: int, w: int, h: int, surface_type: str, perspective_strength: float
    ) -> np.ndarray:
        pts_src = np.float32([
            [0, 0],
            [canvas_w, 0],
            [canvas_w, canvas_h],
            [0, canvas_h]
        ])

        if surface_type.lower() == "floor":
            compress_top = max(0.15, 1.0 - (perspective_strength * 0.70))
            pts_dst = np.float32([
                [w * (1.0 - compress_top) * 0.5, 0],
                [w - w * (1.0 - compress_top) * 0.5, 0],
                [w * 1.15, h],
                [-w * 0.15, h]
            ])
        else:
            pts_dst = np.float32([
                [0, 0],
                [w, 0],
                [w, h],
                [0, h]
            ])

        M = cv2.getPerspectiveTransform(pts_src, pts_dst)
        return cv2.warpPerspective(tiled_flat, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)

    def _render_bilateral_shading(
        self, orig_np: np.ndarray, warped_tiles: np.ndarray, mask: np.ndarray, shadow_retention: float, glossiness: float
    ) -> np.ndarray:
        orig_gray = cv2.cvtColor(orig_np, cv2.COLOR_RGB2GRAY).astype(np.float32)
        bilateral_shading = cv2.bilateralFilter(orig_gray, d=9, sigmaColor=75, sigmaSpace=75)
        
        mask_vals = bilateral_shading[mask]
        mean_lum = np.mean(mask_vals) if len(mask_vals) > 0 else 128.0
        shading_norm = bilateral_shading / max(1.0, mean_lum)
        shading_3d = np.repeat(shading_norm[:, :, np.newaxis], 3, axis=2)

        tiles_float = warped_tiles.astype(np.float32)
        modulated = tiles_float * (1.0 - shadow_retention + shadow_retention * shading_3d)

        if glossiness > 0.1:
            specular = np.clip((shading_norm - 1.15) * (glossiness * 1.4), 0.0, 1.0)
            modulated += np.repeat(specular[:, :, np.newaxis], 3, axis=2) * 255.0

        modulated = np.clip(modulated, 0.0, 255.0)
        return self._alpha_composite(orig_np, modulated, mask)

    def _render_poisson_blending(
        self, orig_np: np.ndarray, warped_tiles: np.ndarray, mask: np.ndarray, shadow_retention: float
    ) -> np.ndarray:
        h, w, _ = orig_np.shape
        y_idx, x_idx = np.where(mask)
        if len(y_idx) == 0:
            return orig_np

        center_x = int((np.min(x_idx) + np.max(x_idx)) // 2)
        center_y = int((np.min(y_idx) + np.max(y_idx)) // 2)
        center = (center_x, center_y)

        mask_uint = (mask.astype(np.uint8) * 255)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        mask_eroded = cv2.erode(mask_uint, kernel, iterations=1)

        try:
            poisson_res = cv2.seamlessClone(
                warped_tiles, orig_np, mask_eroded, center, cv2.NORMAL_CLONE
            )
            return self._alpha_composite(orig_np, poisson_res, mask)
        except Exception as e:
            api_logger.warning(f"Poisson clone fallback: {e}")
            return self._render_bilateral_shading(orig_np, warped_tiles, mask, shadow_retention, 0.5)

    def _render_intrinsic_decomposition(
        self, orig_np: np.ndarray, warped_tiles: np.ndarray, mask: np.ndarray, shadow_retention: float, glossiness: float
    ) -> np.ndarray:
        orig_gray = cv2.cvtColor(orig_np, cv2.COLOR_RGB2GRAY).astype(np.float32)

        low_freq = cv2.GaussianBlur(orig_gray, (45, 45), 0)
        mid_freq = cv2.GaussianBlur(orig_gray, (15, 15), 0)
        high_freq = orig_gray - mid_freq

        mask_vals = orig_gray[mask]
        mean_lum = np.mean(mask_vals) if len(mask_vals) > 0 else 128.0

        low_shading = low_freq / max(1.0, mean_lum)
        mid_shading = mid_freq / max(1.0, mean_lum)
        combined_shading = 0.6 * low_shading + 0.4 * mid_shading
        shading_3d = np.repeat(combined_shading[:, :, np.newaxis], 3, axis=2)

        tiles_float = warped_tiles.astype(np.float32)
        modulated = tiles_float * (1.0 - shadow_retention + shadow_retention * shading_3d)

        if glossiness > 0.1:
            specular_refl = np.clip(high_freq * (glossiness * 0.8), 0.0, 100.0)
            modulated += np.repeat(specular_refl[:, :, np.newaxis], 3, axis=2)

        modulated = np.clip(modulated, 0.0, 255.0)
        return self._alpha_composite(orig_np, modulated, mask)

    def _render_normal_depth_shading(
        self, orig_np: np.ndarray, warped_tiles: np.ndarray, mask: np.ndarray, surface_type: str, shadow_retention: float, glossiness: float
    ) -> np.ndarray:
        h, w, _ = orig_np.shape
        y_grid, x_grid = np.mgrid[0:h, 0:w]
        
        if surface_type.lower() == "floor":
            depth_ramp = (y_grid.astype(np.float32) / h)
            nx = np.zeros((h, w), dtype=np.float32)
            ny = -0.7 * np.ones((h, w), dtype=np.float32)
            nz = 0.7 * np.ones((h, w), dtype=np.float32)
        else:
            depth_ramp = 0.8 + 0.2 * (x_grid.astype(np.float32) / w)
            nx = 0.2 * np.ones((h, w), dtype=np.float32)
            ny = 0.0 * np.ones((h, w), dtype=np.float32)
            nz = 0.98 * np.ones((h, w), dtype=np.float32)

        lx, ly, lz = 0.2, -0.6, 0.77
        dot_product = np.clip(nx * lx + ny * ly + nz * lz, 0.2, 1.0)
        
        directional_lighting = dot_product * (0.65 + 0.35 * depth_ramp)
        dir_3d = np.repeat(directional_lighting[:, :, np.newaxis], 3, axis=2)

        orig_gray = cv2.cvtColor(orig_np, cv2.COLOR_RGB2GRAY).astype(np.float32)
        orig_shadow = cv2.GaussianBlur(orig_gray, (21, 21), 0)
        mean_lum = np.mean(orig_shadow[mask]) if np.any(mask) else 128.0
        ambient_shadow = orig_shadow / max(1.0, mean_lum)
        ambient_3d = np.repeat(ambient_shadow[:, :, np.newaxis], 3, axis=2)

        composite_light = 0.4 * dir_3d + 0.6 * ambient_3d

        tiles_float = warped_tiles.astype(np.float32)
        modulated = tiles_float * (1.0 - shadow_retention + shadow_retention * composite_light)
        modulated = np.clip(modulated, 0.0, 255.0)

        return self._alpha_composite(orig_np, modulated, mask)

    def _render_hybrid_photoreal(
        self, orig_np: np.ndarray, warped_tiles: np.ndarray, mask: np.ndarray, surface_type: str, shadow_retention: float, glossiness: float
    ) -> np.ndarray:
        orig_gray = cv2.cvtColor(orig_np, cv2.COLOR_RGB2GRAY).astype(np.float32)

        bilateral_lum = cv2.bilateralFilter(orig_gray, d=7, sigmaColor=50, sigmaSpace=50)
        macro_field = cv2.GaussianBlur(orig_gray, (31, 31), 0)
        
        mask_vals = orig_gray[mask]
        mean_lum = np.mean(mask_vals) if len(mask_vals) > 0 else 128.0

        shading_map = (0.65 * bilateral_lum + 0.35 * macro_field) / max(1.0, mean_lum)
        shading_3d = np.repeat(shading_map[:, :, np.newaxis], 3, axis=2)

        tiles_float = warped_tiles.astype(np.float32)
        modulated = tiles_float * (1.0 - shadow_retention + shadow_retention * shading_3d)

        if glossiness > 0.05:
            specular_mask = np.clip((shading_map - 1.1) * (glossiness * 1.6), 0.0, 1.0)
            specular_3d = np.repeat(specular_mask[:, :, np.newaxis], 3, axis=2) * 255.0
            modulated += specular_3d

        modulated = np.clip(modulated, 0.0, 255.0)
        return self._alpha_composite(orig_np, modulated, mask)

    def _alpha_composite(self, orig_np: np.ndarray, rendered_layer: np.ndarray, mask: np.ndarray) -> np.ndarray:
        mask_uint = (mask.astype(np.uint8) * 255)
        feathered_mask = cv2.GaussianBlur(mask_uint, (5, 5), 0).astype(np.float32) / 255.0
        feathered_mask_3d = np.repeat(feathered_mask[:, :, np.newaxis], 3, axis=2)

        final_composite = (
            orig_np.astype(np.float32) * (1.0 - feathered_mask_3d) +
            rendered_layer.astype(np.float32) * feathered_mask_3d
        )
        return np.clip(final_composite, 0.0, 255.0).astype(np.uint8)

tile_renderer_v3 = PerspectiveTileRendererV3()

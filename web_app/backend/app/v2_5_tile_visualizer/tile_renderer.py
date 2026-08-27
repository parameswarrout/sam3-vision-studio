import io
import time
import base64
import math
import numpy as np
import cv2
from PIL import Image, ImageFilter
from typing import Dict, Any, Optional, Tuple

from app.core import api_logger
from app.v2_5_tile_visualizer.tile_catalog import get_tile_by_id, generate_tile_texture

class PerspectiveTileRenderer:
    """
    Multi-Engine Photorealistic Perspective-Aware Tile Projection & Blending System.
    Supports 5 distinct blending algorithms:
      1. 'hybrid': Hybrid Photoreal Matrix (Multi-Scale Intrinsic + Normal Falloff + Specular)
      2. 'bilateral': Bilateral Guided Shading (Edge-preserving macro shadow isolation)
      3. 'poisson': Poisson Gradient Blending (cv2.seamlessClone PDE solver)
      4. 'intrinsic': Multi-Scale Intrinsic Decomposition (Albedo/Shading/Specular decoupling)
      5. 'normal_depth': 3D Surface Normal & Directional Light Falloff
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
    ) -> Dict[str, Any]:
        """
        Renders the chosen tile pattern onto the masked region with the selected blending engine.
        """
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
            }

        # 1. Fetch / Generate Tile Texture
        tile_info = get_tile_by_id(tile_id)
        tex_img = generate_tile_texture(tile_id, size=512)
        tex_np = np.array(tex_img)

        # 2. Tile Repetition Grid
        base_tile_s = int(120 * scale)
        base_tile_s = max(24, min(base_tile_s, 600))
        tex_resized = cv2.resize(tex_np, (base_tile_s, base_tile_s), interpolation=cv2.INTER_LANCZOS4)

        # 3. Create Seamless Flat Repeated Canvas
        pad_factor = 2.0
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

        # 5. Perspective Warp Projection
        warped_tiles = self._apply_perspective_warp(
            tiled_flat, canvas_w, canvas_h, w, h, surface_type, perspective_strength
        )

        # 6. Apply Selected Blending Engine
        mode = blending_mode.lower().strip()
        if mode == "bilateral":
            final_np = self._render_bilateral_shading(
                orig_np, warped_tiles, mask, shadow_retention, glossiness
            )
        elif mode == "poisson":
            final_np = self._render_poisson_blending(
                orig_np, warped_tiles, mask, shadow_retention
            )
        elif mode == "intrinsic":
            final_np = self._render_intrinsic_decomposition(
                orig_np, warped_tiles, mask, shadow_retention, glossiness
            )
        elif mode == "normal_depth":
            final_np = self._render_normal_depth_shading(
                orig_np, warped_tiles, mask, surface_type, shadow_retention, glossiness
            )
        else: # "hybrid" (Default Best)
            final_np = self._render_hybrid_photoreal(
                orig_np, warped_tiles, mask, surface_type, shadow_retention, glossiness
            )

        # Convert back to PIL Image & Base64
        rendered_pil = Image.fromarray(final_np, mode="RGB")
        buf = io.BytesIO()
        rendered_pil.save(buf, format="JPEG", quality=95, optimize=True)
        img_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

        exec_ms = round((time.time() - t0) * 1000, 1)
        api_logger.info(
            f"[TileRenderer] Rendered '{tile_id}' using engine '{mode}' on {surface_type} in {exec_ms}ms"
        )

        return {
            "rendered_image_base64": img_b64,
            "rendered_pil": rendered_pil,
            "execution_time_ms": exec_ms,
            "blending_mode": mode,
        }

    # -------------------------------------------------------------
    # Perspective Transformation
    # -------------------------------------------------------------
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

    # -------------------------------------------------------------
    # Engine 1: Bilateral Guided Shading (Edge-Preserving Macro Shadows)
    # -------------------------------------------------------------
    def _render_bilateral_shading(
        self, orig_np: np.ndarray, warped_tiles: np.ndarray, mask: np.ndarray, shadow_retention: float, glossiness: float
    ) -> np.ndarray:
        orig_gray = cv2.cvtColor(orig_np, cv2.COLOR_RGB2GRAY).astype(np.float32)
        # Bilateral filter preserves sharp shadow edges (sofa/table legs) while smoothing out micro grain
        bilateral_shading = cv2.bilateralFilter(orig_gray, d=9, sigmaColor=75, sigmaSpace=75)
        
        mask_vals = bilateral_shading[mask]
        mean_lum = np.mean(mask_vals) if len(mask_vals) > 0 else 128.0
        shading_norm = bilateral_shading / max(1.0, mean_lum)
        shading_3d = np.repeat(shading_norm[:, :, np.newaxis], 3, axis=2)

        tiles_float = warped_tiles.astype(np.float32)
        modulated = tiles_float * (1.0 - shadow_retention + shadow_retention * shading_3d)

        # Specular glint
        if glossiness > 0.1:
            specular = np.clip((shading_norm - 1.15) * (glossiness * 1.4), 0.0, 1.0)
            modulated += np.repeat(specular[:, :, np.newaxis], 3, axis=2) * 255.0

        modulated = np.clip(modulated, 0.0, 255.0)
        return self._alpha_composite(orig_np, modulated, mask)

    # -------------------------------------------------------------
    # Engine 2: Poisson Seamless Gradient Blending
    # -------------------------------------------------------------
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

        # Erode mask slightly so Poisson solver has valid boundary gradients on all 4 sides
        mask_uint = (mask.astype(np.uint8) * 255)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        mask_eroded = cv2.erode(mask_uint, kernel, iterations=1)

        try:
            # Poisson seamless clone matches gradients and color temperature
            poisson_res = cv2.seamlessClone(
                warped_tiles, orig_np, mask_eroded, center, cv2.NORMAL_CLONE
            )
            # Alpha composite with feathered mask for seamless outer boundary
            return self._alpha_composite(orig_np, poisson_res, mask)
        except Exception as e:
            api_logger.warning(f"Poisson clone fallback: {e}")
            return self._render_bilateral_shading(orig_np, warped_tiles, mask, shadow_retention, 0.5)

    # -------------------------------------------------------------
    # Engine 3: Multi-Scale Intrinsic Decomposition
    # -------------------------------------------------------------
    def _render_intrinsic_decomposition(
        self, orig_np: np.ndarray, warped_tiles: np.ndarray, mask: np.ndarray, shadow_retention: float, glossiness: float
    ) -> np.ndarray:
        orig_gray = cv2.cvtColor(orig_np, cv2.COLOR_RGB2GRAY).astype(np.float32)

        # Multi-scale decomposition:
        # Scale 1: Low-frequency global ambient lighting field
        low_freq = cv2.GaussianBlur(orig_gray, (45, 45), 0)
        # Scale 2: Mid-frequency ambient occlusion and drop shadows
        mid_freq = cv2.GaussianBlur(orig_gray, (15, 15), 0)
        # Scale 3: High-frequency specular reflections
        high_freq = orig_gray - mid_freq

        mask_vals = orig_gray[mask]
        mean_lum = np.mean(mask_vals) if len(mask_vals) > 0 else 128.0

        low_shading = low_freq / max(1.0, mean_lum)
        mid_shading = mid_freq / max(1.0, mean_lum)
        combined_shading = 0.6 * low_shading + 0.4 * mid_shading
        shading_3d = np.repeat(combined_shading[:, :, np.newaxis], 3, axis=2)

        tiles_float = warped_tiles.astype(np.float32)
        modulated = tiles_float * (1.0 - shadow_retention + shadow_retention * shading_3d)

        # Re-inject high frequency specular reflections
        if glossiness > 0.1:
            specular_refl = np.clip(high_freq * (glossiness * 0.8), 0.0, 100.0)
            modulated += np.repeat(specular_refl[:, :, np.newaxis], 3, axis=2)

        modulated = np.clip(modulated, 0.0, 255.0)
        return self._alpha_composite(orig_np, modulated, mask)

    # -------------------------------------------------------------
    # Engine 4: Depth & Surface Normal Shading (3D Geometric Falloff)
    # -------------------------------------------------------------
    def _render_normal_depth_shading(
        self, orig_np: np.ndarray, warped_tiles: np.ndarray, mask: np.ndarray, surface_type: str, shadow_retention: float, glossiness: float
    ) -> np.ndarray:
        h, w, _ = orig_np.shape
        # Synthesize virtual 3D room depth gradient (near=1.0, far=0.2)
        y_grid, x_grid = np.mgrid[0:h, 0:w]
        
        if surface_type.lower() == "floor":
            depth_ramp = (y_grid.astype(np.float32) / h)
            # Normal vector pointing upward from ground plane
            nx = np.zeros((h, w), dtype=np.float32)
            ny = -0.7 * np.ones((h, w), dtype=np.float32)
            nz = 0.7 * np.ones((h, w), dtype=np.float32)
        else:
            depth_ramp = 0.8 + 0.2 * (x_grid.astype(np.float32) / w)
            nx = 0.2 * np.ones((h, w), dtype=np.float32)
            ny = 0.0 * np.ones((h, w), dtype=np.float32)
            nz = 0.98 * np.ones((h, w), dtype=np.float32)

        # Virtual room ceiling light direction
        lx, ly, lz = 0.2, -0.6, 0.77
        dot_product = np.clip(nx * lx + ny * ly + nz * lz, 0.2, 1.0)
        
        # Depth falloff (darker in the distance, brighter near camera/window)
        directional_lighting = dot_product * (0.65 + 0.35 * depth_ramp)
        dir_3d = np.repeat(directional_lighting[:, :, np.newaxis], 3, axis=2)

        # Blend with original ambient shadows
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

    # -------------------------------------------------------------
    # Engine 5: Hybrid Photoreal Matrix (Combined Master Pipeline)
    # -------------------------------------------------------------
    def _render_hybrid_photoreal(
        self, orig_np: np.ndarray, warped_tiles: np.ndarray, mask: np.ndarray, surface_type: str, shadow_retention: float, glossiness: float
    ) -> np.ndarray:
        orig_gray = cv2.cvtColor(orig_np, cv2.COLOR_RGB2GRAY).astype(np.float32)

        # 1. Edge-preserving bilateral ambient occlusion
        bilateral_lum = cv2.bilateralFilter(orig_gray, d=7, sigmaColor=50, sigmaSpace=50)
        # 2. Multi-scale background lighting field
        macro_field = cv2.GaussianBlur(orig_gray, (31, 31), 0)
        
        mask_vals = orig_gray[mask]
        mean_lum = np.mean(mask_vals) if len(mask_vals) > 0 else 128.0

        shading_map = (0.65 * bilateral_lum + 0.35 * macro_field) / max(1.0, mean_lum)
        shading_3d = np.repeat(shading_map[:, :, np.newaxis], 3, axis=2)

        # 3. Modulate Tile Texture with Lighting
        tiles_float = warped_tiles.astype(np.float32)
        modulated = tiles_float * (1.0 - shadow_retention + shadow_retention * shading_3d)

        # 4. Specular gloss reflection boost
        if glossiness > 0.05:
            specular_mask = np.clip((shading_map - 1.1) * (glossiness * 1.6), 0.0, 1.0)
            specular_3d = np.repeat(specular_mask[:, :, np.newaxis], 3, axis=2) * 255.0
            modulated += specular_3d

        modulated = np.clip(modulated, 0.0, 255.0)
        return self._alpha_composite(orig_np, modulated, mask)

    # -------------------------------------------------------------
    # Helper: Sub-Pixel Anti-Aliased Alpha Feathering
    # -------------------------------------------------------------
    def _alpha_composite(self, orig_np: np.ndarray, rendered_layer: np.ndarray, mask: np.ndarray) -> np.ndarray:
        mask_uint = (mask.astype(np.uint8) * 255)
        # 5px Gaussian blur along edges prevents jagged pixel staircases
        feathered_mask = cv2.GaussianBlur(mask_uint, (5, 5), 0).astype(np.float32) / 255.0
        feathered_mask_3d = np.repeat(feathered_mask[:, :, np.newaxis], 3, axis=2)

        final_composite = (
            orig_np.astype(np.float32) * (1.0 - feathered_mask_3d) +
            rendered_layer.astype(np.float32) * feathered_mask_3d
        )
        return np.clip(final_composite, 0.0, 255.0).astype(np.uint8)

tile_renderer = PerspectiveTileRenderer()

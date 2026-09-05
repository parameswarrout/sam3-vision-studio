import time
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import cv2
from PIL import Image, ImageDraw

from app.core import api_logger
from app.services.tile_engine.tile_catalog import TILE_CATALOG, generate_tile_texture

class PBRMaterialStage4:
    """
    STAGE 4 — Material Application & PBR Asset Engine.
    Implements:
      1. Authored PBR SKUs (Albedo, Roughness, Tangent Normal/Height, Metalness, Metric Physical Scale).
      2. Non-approximated Metric UV Texture Sampling (replaces 2D homography warp).
      3. Physically consistent 3D grout spacing and scale mapping.
    """

    def __init__(self):
        self._cache = {}

    def get_pbr_material(self, tile_id: str) -> Dict[str, Any]:
        """
        Retrieves or generates authored PBR material channels for a given SKU.
        Returns:
          albedo_tex: (512, 512, 3) float32 in [0, 1]
          normal_tex: (512, 512, 3) float32 tangent unit normals in [-1, 1]
          roughness_tex: (512, 512) float32 in [0, 1]
          metalness_tex: (512, 512) float32 in [0, 1]
          metric_size: Tuple[float, float] in meters (width, height)
        """
        if tile_id in self._cache:
            return self._cache[tile_id]

        # Find in catalog or use fallback
        matched = next((t for t in TILE_CATALOG if t["id"] == tile_id), None)
        if not matched:
            matched = TILE_CATALOG[0]

        # Generate base texture
        tex_pil = generate_tile_texture(matched["id"], size=512)
        albedo_np = np.array(tex_pil).astype(np.float32) / 255.0

        # Physical metric dimensions based on category
        cat = matched.get("category", "marble").lower()
        aspect = matched.get("aspect_ratio", "square")

        if aspect == "plank" or cat == "wood":
            metric_size = (0.20, 1.20)  # 20cm x 120cm plank
        elif aspect == "pattern":
            metric_size = (0.45, 0.45)  # 45cm x 45cm pattern
        elif aspect == "subway":
            metric_size = (0.10, 0.30)  # 10cm x 30cm subway
        else:
            metric_size = (0.60, 0.60)  # 60cm x 60cm standard large tile

        # Author Normal Map via Sobel micro-relief + Grout depression
        gray_tex = cv2.cvtColor(albedo_np, cv2.COLOR_RGB2GRAY)
        gx = cv2.Sobel(gray_tex, cv2.CV_32F, 1, 0, ksize=3)
        gy = cv2.Sobel(gray_tex, cv2.CV_32F, 0, 1, ksize=3)

        bump_scale = 2.0
        nx = -bump_scale * gx
        ny = -bump_scale * gy
        nz = np.ones_like(gray_tex, dtype=np.float32)

        # Add grout channel bevels along borders
        b = 6  # 6px grout border
        nz[:b, :] *= 0.7
        nz[-b:, :] *= 0.7
        nz[:, :b] *= 0.7
        nz[:, -b:] *= 0.7

        norm = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2) + 1e-6
        normal_tex = np.stack([nx / norm, ny / norm, nz / norm], axis=-1)

        # Author Roughness Map
        base_rough = float(matched.get("roughness", 0.30))
        # High-frequency micro-roughness variation
        rough_noise = (gray_tex - np.mean(gray_tex)) * 0.15
        roughness_tex = np.clip(base_rough + rough_noise, 0.05, 0.95).astype(np.float32)

        # Author Metalness Map (mostly dielectric non-metal for ceramics/stone)
        metalness_tex = np.full_like(gray_tex, 0.02, dtype=np.float32)

        pbr_asset = {
            "id": matched["id"],
            "name": matched["name"],
            "category": cat,
            "albedo_tex": albedo_np,
            "normal_tex": normal_tex,
            "roughness_tex": roughness_tex,
            "metalness_tex": metalness_tex,
            "metric_size": metric_size,
            "base_scale": float(matched.get("default_scale", 1.0))
        }

        self._cache[tile_id] = pbr_asset
        return pbr_asset

    def sample_material_on_uv(
        self,
        uv_map: np.ndarray,
        surface_mask: np.ndarray,
        pbr_material: Dict[str, Any],
        scale_multiplier: float = 1.0,
        grout_width_mm: float = 3.0,
        grout_color_rgb: Tuple[float, float, float] = (0.85, 0.85, 0.88)
    ) -> Dict[str, np.ndarray]:
        """
        Samples PBR maps on the dense metric UV coordinates:
          u_norm = (u / (tile_w * scale)) % 1.0
          v_norm = (v / (tile_h * scale)) % 1.0
        Returns mapped (H, W, 3) Albedo, Tangent Normal, Roughness, Metalness.
        """
        t0 = time.time()
        h, w = uv_map.shape[:2]

        tile_w_m, tile_h_m = pbr_material["metric_size"]
        tile_w_m *= max(0.1, scale_multiplier)
        tile_h_m *= max(0.1, scale_multiplier)

        # Compute normalized UV coordinates in [0, 1] for texture lookup
        u_m = uv_map[:, :, 0]
        v_m = uv_map[:, :, 1]

        u_norm = np.mod(u_m / tile_w_m, 1.0)
        v_norm = np.mod(v_m / tile_h_m, 1.0)

        # Map to pixel indices in 512x512 texture
        tex_h, tex_w = pbr_material["albedo_tex"].shape[:2]
        px_x = np.clip((u_norm * (tex_w - 1)).astype(np.float32), 0.0, float(tex_w - 1))
        px_y = np.clip((v_norm * (tex_h - 1)).astype(np.float32), 0.0, float(tex_h - 1))

        # Bilinear Texture Remapping via cv2.remap
        albedo_mapped = cv2.remap(
            pbr_material["albedo_tex"], px_x, px_y, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP
        )
        normal_mapped = cv2.remap(
            pbr_material["normal_tex"], px_x, px_y, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP
        )
        roughness_mapped = cv2.remap(
            pbr_material["roughness_tex"], px_x, px_y, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP
        )
        metalness_mapped = cv2.remap(
            pbr_material["metalness_tex"], px_x, px_y, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP
        )

        # 3D Grout lines in metric coordinates
        # Real-world grout width in meters
        grout_w_m = grout_width_mm / 1000.0
        dist_u = np.minimum(u_norm * tile_w_m, (1.0 - u_norm) * tile_w_m)
        dist_v = np.minimum(v_norm * tile_h_m, (1.0 - v_norm) * tile_h_m)
        min_grout_dist = np.minimum(dist_u, dist_v)

        # Smooth grout mask
        grout_profile = np.clip(1.0 - (min_grout_dist / max(1e-4, grout_w_m)), 0.0, 1.0)
        grout_profile = grout_profile ** 1.5

        # Blend grout color into mapped albedo
        g_col = np.array(grout_color_rgb, dtype=np.float32)[None, None, :]
        albedo_with_grout = (1.0 - grout_profile[:, :, None]) * albedo_mapped + grout_profile[:, :, None] * g_col

        # Increase roughness in grout joints
        roughness_with_grout = np.clip(roughness_mapped + 0.35 * grout_profile, 0.0, 1.0)

        exec_ms = round((time.time() - t0) * 1000, 2)
        api_logger.info(f"[Stage 4] Material mapped in {exec_ms}ms (SKU: {pbr_material['id']}, Metric scale: {tile_w_m*100:.1f}x{tile_h_m*100:.1f}cm)")

        return {
            "albedo_mapped": albedo_with_grout.astype(np.float32),
            "normal_mapped": normal_mapped.astype(np.float32),
            "roughness_mapped": roughness_with_grout.astype(np.float32),
            "metalness_mapped": metalness_mapped.astype(np.float32),
            "grout_profile": grout_profile.astype(np.float32),
            "execution_time_ms": exec_ms
        }

stage4_materials = PBRMaterialStage4()

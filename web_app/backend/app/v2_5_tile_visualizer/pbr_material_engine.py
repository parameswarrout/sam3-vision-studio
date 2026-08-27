import numpy as np
import cv2
from typing import Tuple, Dict, Any, Optional

from app.core import api_logger

class PBRMaterialEngine:
    """
    Physically Based Rendering (PBR) Micro-Surface & Light Reflection Engine.
    Implements:
      1. Dynamic Sobel Normal Bump Mapping (Tactile 3D stone clefts, wood grain pores)
      2. 3D Grout Crevice Depth & Ambient Occlusion (AO) Valley Shadows
      3. Schlick's Fresnel Specular Glint & Room Window Light Bounce Harvest
    """

    def generate_normal_map(self, texture_np: np.ndarray, bump_strength: float = 1.0) -> np.ndarray:
        """
        Generates a normalized 3-channel tangent-space normal map (RGB in [-1, 1])
        from tile texture luminance using Sobel gradient filters.
        """
        if len(texture_np.shape) == 3:
            gray = cv2.cvtColor(texture_np, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
        else:
            gray = texture_np.astype(np.float32) / 255.0

        # Compute horizontal and vertical image gradients
        grad_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)

        # Normal vector: [-k*dx, -k*dy, 1.0]
        k = bump_strength * 2.5
        nx = -k * grad_x
        ny = -k * grad_y
        nz = np.ones_like(gray, dtype=np.float32)

        # Normalize normal vector to unit length
        norm = np.sqrt(nx * nx + ny * ny + nz * nz) + 1e-6
        nx /= norm
        ny /= norm
        nz /= norm

        normal_map = np.stack([nx, ny, nz], axis=2)
        return normal_map

    def apply_pbr_bump_relief(
        self,
        warped_tiles: np.ndarray,
        bump_strength: float = 0.5,
        light_dir: Tuple[float, float, float] = (0.25, -0.65, 0.70),
    ) -> np.ndarray:
        """
        Applies micro-surface normal perturbation to the warped tiles,
        giving stone and wood grain tactile 3D relief.
        """
        if bump_strength < 0.05:
            return warped_tiles

        normal_map = self.generate_normal_map(warped_tiles, bump_strength=bump_strength)
        lx, ly, lz = light_dir
        l_norm = math_norm = np.sqrt(lx * lx + ly * ly + lz * lz) + 1e-6
        lx, ly, lz = lx / l_norm, ly / l_norm, lz / l_norm

        # Lambertian cosine law: N . L
        dot_product = (
            normal_map[:, :, 0] * lx +
            normal_map[:, :, 1] * ly +
            normal_map[:, :, 2] * lz
        )
        dot_product = np.clip(dot_product, 0.35, 1.25)
        relief_shading = np.repeat(dot_product[:, :, np.newaxis], 3, axis=2)

        pbr_relief = warped_tiles.astype(np.float32) * (0.60 + 0.40 * relief_shading)
        return np.clip(pbr_relief, 0.0, 255.0).astype(np.uint8)

    def apply_3d_grout_crevices(
        self,
        warped_tiles: np.ndarray,
        grout_width: int = 2,
        crevice_depth: float = 0.45,
    ) -> np.ndarray:
        """
        Generates 3D Ambient Occlusion (AO) contact shadows inside grout seams.
        """
        if crevice_depth < 0.05:
            return warped_tiles

        h, w = warped_tiles.shape[:2]
        gray = cv2.cvtColor(warped_tiles, cv2.COLOR_RGB2GRAY)
        
        # Detect dark or bright grout lines via Laplacian / edge gradient
        laplacian = cv2.Laplacian(gray, cv2.CV_32F)
        grout_edge = np.abs(laplacian) > np.percentile(np.abs(laplacian), 88)

        # Distance transform to grout seam centers
        inv_grout = (~grout_edge).astype(np.uint8)
        dist = cv2.distanceTransform(inv_grout, cv2.DIST_L2, 3)

        # Parabolic crevice shadow profile
        sigma = max(1.0, float(grout_width) * 1.5)
        ao_crevice = 1.0 - crevice_depth * np.exp(-(dist ** 2) / (2.0 * sigma * sigma))
        ao_3d = np.repeat(np.clip(ao_crevice, 0.3, 1.0)[:, :, np.newaxis], 3, axis=2)

        tiled_with_grout_ao = warped_tiles.astype(np.float32) * ao_3d
        return np.clip(tiled_with_grout_ao, 0.0, 255.0).astype(np.uint8)

    def harvest_window_fresnel_reflections(
        self,
        orig_np: np.ndarray,
        rendered_tiles: np.ndarray,
        mask: np.ndarray,
        glossiness: float = 0.65,
        fresnel_strength: float = 0.50,
        roughness: float = 0.30,
    ) -> np.ndarray:
        """
        Extracts high-luminance room light sources (windows, chandeliers, spotlights)
        and projects blurred Fresnel specular reflections onto glossy/polished tiles.
        """
        if glossiness < 0.10 or fresnel_strength < 0.05:
            return rendered_tiles

        h, w = orig_np.shape[:2]
        orig_gray = cv2.cvtColor(orig_np, cv2.COLOR_RGB2GRAY).astype(np.float32)

        # 1. Harvest high-luminance window & light highlights
        high_threshold = np.percentile(orig_gray, 85)
        light_harvest = np.clip((orig_gray - high_threshold) / (255.0 - high_threshold + 1e-5), 0.0, 1.0)
        
        # Invert vertical coordinates to approximate planar ground reflection
        refl_source = cv2.flip(light_harvest, 0)
        # Apply roughness blur to reflection
        blur_k = int(15 + 40 * roughness)
        if blur_k % 2 == 0:
            blur_k += 1
        blurred_refl = cv2.GaussianBlur(refl_source, (blur_k, blur_k), 0)

        # 2. Schlick's Fresnel Reflectance Equation:
        # F(theta) = F0 + (1 - F0) * (1 - cos(theta))^5
        # Near camera (y=H) glancing angle is high; far away (y=0 near horizon) reflectance approaches 100%
        y_grid = np.linspace(0.0, 1.0, h, dtype=np.float32)[:, np.newaxis]
        f0 = 0.04 # Standard dielectric baseline for vitrified ceramic / polished marble
        glancing_factor = (1.0 - y_grid) ** 3.5 # Rapid increase near the horizon
        fresnel_map = f0 + (1.0 - f0) * glancing_factor
        fresnel_3d = np.repeat(fresnel_map[:, :, np.newaxis], w, axis=1)

        # 3. Composite Reflection onto Rendered Tile Layer
        reflection_intensity = fresnel_strength * glossiness * blurred_refl[:, :, np.newaxis] * fresnel_3d
        reflection_color = np.array([255.0, 250.0, 240.0], dtype=np.float32) # Warm daylight glow

        rendered_float = rendered_tiles.astype(np.float32)
        final_with_refl = rendered_float + reflection_intensity * reflection_color * 1.35
        return np.clip(final_with_refl, 0.0, 255.0).astype(np.uint8)

pbr_material_engine = PBRMaterialEngine()

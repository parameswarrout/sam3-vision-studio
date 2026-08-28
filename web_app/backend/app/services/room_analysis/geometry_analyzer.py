import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image
from scipy.ndimage import sobel, gaussian_filter

class GeometryAnalyzer:
    """
    Planar Geometry & Surface Normal Engine for Indoor Architecture.
    Analyzes 3D plane orientations, normal vectors, horizon line, and seam boundaries.
    """

    @staticmethod
    def compute_surface_normals(depth_map: np.ndarray) -> np.ndarray:
        """
        Computes 3D surface normal unit vectors (Nx, Ny, Nz) for each pixel.
        Returns array of shape (H, W, 3).
        """
        # Smooth depth slightly to reduce high-frequency noise
        smoothed_depth = gaussian_filter(depth_map, sigma=1.5)

        # Sobel gradients
        dz_dx = sobel(smoothed_depth, axis=1)
        dz_dy = sobel(smoothed_depth, axis=0)

        # Normal vector N = (-dz/dx, -dz/dy, 1.0) normalized
        nx = -dz_dx
        ny = -dz_dy
        nz = np.ones_like(depth_map, dtype=np.float32)

        norm = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
        norm = np.maximum(norm, 1e-6)

        normals = np.stack([nx / norm, ny / norm, nz / norm], axis=-1)
        return normals

    @classmethod
    def classify_plane_orientation(cls, mask: np.ndarray, normals: np.ndarray, img_h: int) -> Dict[str, Any]:
        """
        Classifies whether a masked region represents a vertical plane (wall),
        ground plane (floor), or ceiling plane based on normal vectors and spatial perspective.
        """
        if not np.any(mask):
            return {"orientation": "unknown", "geometry_confidence": 0.50, "normal_mean": [0, 0, 1]}

        masked_normals = normals[mask]
        mean_normal = np.mean(masked_normals, axis=0)
        norm_mag = np.linalg.norm(mean_normal)
        if norm_mag > 1e-6:
            mean_normal /= norm_mag

        nx, ny, nz = mean_normal
        y_indices, x_indices = np.where(mask)
        mean_y_norm = np.mean(y_indices) / img_h
        variance = float(np.mean(np.var(masked_normals, axis=0)))

        # Ground plane: Dominates lower perspective region (mean_y > 0.50)
        if mean_y_norm >= 0.55:
            orientation = "ground_plane"
            geom_conf = float(np.clip(1.0 - variance * 2.0, 0.75, 0.98))
        # Ceiling plane: Dominates top perspective region (mean_y < 0.25)
        elif mean_y_norm <= 0.25:
            orientation = "ceiling_plane"
            geom_conf = float(np.clip(1.0 - variance * 2.0, 0.70, 0.95))
        # Vertical wall plane: Spans vertical span
        else:
            orientation = "vertical_plane"
            geom_conf = float(np.clip(1.0 - variance * 1.5, 0.75, 0.98))

        return {
            "orientation": orientation,
            "geometry_confidence": round(geom_conf, 3),
            "normal_mean": [round(float(nx), 3), round(float(ny), 3), round(float(nz), 3)],
            "plane_variance": round(variance, 4),
        }

    @classmethod
    def detect_vertical_seams(cls, image: Image.Image, depth_map: np.ndarray) -> List[int]:
        """
        Detects prominent vertical corner / wall seam positions along the x-axis.
        Uses Sobel horizontal edge gradients and depth discontinuity valleys.
        """
        w, h = image.size
        # Convert image to grayscale numpy array
        gray = np.array(image.convert("L"), dtype=np.float32) / 255.0

        # Gradient along x-axis for image intensity and depth
        grad_img_x = np.abs(sobel(gray, axis=1))
        grad_depth_x = np.abs(sobel(depth_map, axis=1))
        combined_grad = 0.5 * grad_img_x + 0.5 * grad_depth_x

        # Vertical projection profile (sum down each column)
        col_profile = np.mean(combined_grad[int(h * 0.15):int(h * 0.75), :], axis=0)
        smoothed_profile = gaussian_filter(col_profile, sigma=w * 0.02)

        # Find significant peaks in gradient (vertical seam candidates)
        threshold = np.mean(smoothed_profile) + 1.2 * np.std(smoothed_profile)
        seams = []
        min_distance = int(w * 0.15)  # Walls must be at least 15% width apart

        for x in range(int(w * 0.10), int(w * 0.90)):
            if smoothed_profile[x] > threshold:
                # Local maximum check
                if smoothed_profile[x] == np.max(smoothed_profile[max(0, x - 10):min(w, x + 11)]):
                    if not seams or (x - seams[-1]) > min_distance:
                        seams.append(x)

        return seams

# Global geometry analyzer instance
geometry_analyzer = GeometryAnalyzer()

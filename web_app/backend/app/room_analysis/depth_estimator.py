import numpy as np
from typing import Optional, Dict, Any, Tuple
from PIL import Image

from app.core.logger import model_logger

class DepthEstimator:
    """
    Geometric Plane & Depth Estimator for Indoor Scene Understanding.
    Provides surface normal orientation and depth gradient hints for planar surface validation.
    """

    def __init__(self, use_external_depth: bool = False):
        self.use_external_depth = use_external_depth
        self._external_model = None

    def estimate_geometry(self, image: Image.Image) -> Dict[str, Any]:
        """
        Computes geometric plane priors (ground plane y-intercepts, vertical horizon gradients).
        Returns plane gradient maps and orientation heuristics.
        """
        w, h = image.size
        
        # Approximate geometric spatial depth gradient (perspective depth increasing toward horizon)
        y_coords = np.linspace(0, 1, h)[:, None]
        # Normalized perspective ground-plane depth map
        depth_map = 1.0 - (y_coords ** 1.2) * 0.8
        depth_map = np.tile(depth_map, (1, w))

        return {
            "depth_map": depth_map,
            "horizon_y": int(h * 0.45),
            "ground_start_y": int(h * 0.55),
            "has_metric_depth": False,
        }

    def compute_plane_normal_hint(self, mask: np.ndarray, bbox: list, img_height: int) -> str:
        """
        Determines whether a segmented region represents a vertical plane (wall)
        or a horizontal/ground plane (floor/ceiling) based on aspect ratio, spatial center of mass,
        and height distribution.
        """
        if not np.any(mask):
            return "unknown"

        y_indices, x_indices = np.where(mask)
        mean_y = np.mean(y_indices) / img_height
        y_span = (np.max(y_indices) - np.min(y_indices)) / img_height

        if mean_y > 0.65 and y_span < 0.60:
            return "ground_plane"
        elif mean_y < 0.25 and y_span < 0.45:
            return "ceiling_plane"
        else:
            return "vertical_plane"

# Global depth estimator instance
depth_estimator = DepthEstimator()

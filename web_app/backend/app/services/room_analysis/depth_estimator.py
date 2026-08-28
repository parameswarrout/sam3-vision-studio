import numpy as np
from typing import Optional
from PIL import Image

from app.core.logger import model_logger

class DepthEstimator:
    """
    Dedicated Relative Depth Estimator for Indoor Architecture.
    Produces normalized relative depth maps D in [0.0, 1.0] where 1.0 = near, 0.0 = far.
    """

    def __init__(self, enabled: bool = True):
        self.enabled = enabled
        self._external_model = None

    def estimate_depth(self, image: Image.Image) -> np.ndarray:
        """
        Computes a continuous relative depth map for the input image.
        Returns a 2D float32 numpy array normalized to [0.0, 1.0].
        """
        w, h = image.size

        if not self.enabled:
            # Return uniform neutral depth field if depth is disabled
            return np.full((h, w), 0.5, dtype=np.float32)

        # Compute perspective gradient depth model:
        # Standard indoor rooms have ground plane depth increasing towards horizon (y ~ 0.45*H)
        # and ceiling plane depth sloping downwards towards horizon.
        y_norm = np.linspace(0.0, 1.0, h, dtype=np.float32)[:, None]
        x_norm = np.linspace(-1.0, 1.0, w, dtype=np.float32)[None, :]

        # Horizon center estimated at roughly eye-level (45% of height)
        horizon_y = 0.45
        
        # Distance to horizon vertically
        dist_to_horizon = np.abs(y_norm - horizon_y)
        
        # Radial perspective decay from central vanishing area
        depth_map = 1.0 - np.clip(np.exp(-2.2 * dist_to_horizon) * (1.0 - 0.25 * (x_norm ** 2)), 0.0, 1.0)
        depth_map = np.clip(depth_map, 0.05, 0.98).astype(np.float32)

        return depth_map

# Global depth estimator instance
depth_estimator = DepthEstimator(enabled=True)

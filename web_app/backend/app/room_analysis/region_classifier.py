import numpy as np
from typing import Dict, Any, List

# Standardized visual color palette for room semantic regions
REGION_PALETTES = {
    "wall": ["#3b82f6", "#60a5fa", "#2563eb", "#93c5fd"],  # Blue shades for distinct wall facets
    "floor": ["#10b981", "#059669"],                       # Emerald Green for floor
    "ceiling": ["#a855f7", "#8b5cf6"],                     # Purple for ceiling
    "window": ["#38bdf8", "#0ea5e9"],                      # Sky Blue for windows
    "door": ["#f59e0b", "#d97706"],                        # Amber for doors
    "furniture": ["#ec4899", "#f43f5e", "#fb7185"],        # Rose/Pink for furniture
}

class RegionClassifier:
    """
    Evaluates multi-signal semantic confidence and validates spatial topological priors
    for indoor room elements (Wall, Floor, Ceiling, Windows, Doors, Furniture).
    """

    @staticmethod
    def compute_spatial_prior(region_type: str, mask: np.ndarray, img_w: int, img_h: int) -> float:
        """
        Scores topological plausibility in [0.0, 1.0] based on where the element sits in 3D indoor space.
        - Floor: expected in lower half (y > 0.40 * H)
        - Ceiling: expected in upper third (y < 0.45 * H)
        - Wall: vertically spanning mid-to-upper region
        - Window / Door: embedded vertically
        """
        if not np.any(mask):
            return 0.0

        y_indices, x_indices = np.where(mask)
        mean_y_norm = np.mean(y_indices) / img_h
        min_y_norm = np.min(y_indices) / img_h
        max_y_norm = np.max(y_indices) / img_h
        area_ratio = np.sum(mask) / (img_w * img_h)

        if region_type == "floor":
            # Floor must touch lower region
            if mean_y_norm >= 0.50 and max_y_norm > 0.70:
                score = 0.95
            elif mean_y_norm >= 0.40:
                score = 0.80
            else:
                score = 0.40
            # Penalty if it's high up near ceiling
            if min_y_norm < 0.15:
                score *= 0.6
            return float(np.clip(score, 0.1, 0.98))

        elif region_type == "ceiling":
            if mean_y_norm <= 0.35 and min_y_norm < 0.10:
                score = 0.95
            elif mean_y_norm <= 0.45:
                score = 0.75
            else:
                score = 0.30
            return float(np.clip(score, 0.1, 0.98))

        elif region_type == "wall":
            # Walls typically occupy mid-to-upper vertical span
            score = 0.85
            if max_y_norm > 0.40 and min_y_norm < 0.70:
                score = 0.92
            # Very small isolated specks penalized
            if area_ratio < 0.01:
                score *= 0.5
            return float(np.clip(score, 0.2, 0.96))

        elif region_type in ["window", "door"]:
            score = 0.88
            # Openings usually vertical aspect ratio
            h_span = max_y_norm - min_y_norm
            if h_span > 0.15:
                score += 0.06
            return float(np.clip(score, 0.3, 0.95))

        elif region_type == "furniture":
            score = 0.85
            # Furniture usually rests on ground
            if mean_y_norm > 0.35:
                score = 0.90
            return float(np.clip(score, 0.3, 0.95))

        return 0.80

    @classmethod
    def calculate_confidence(
        cls,
        region_type: str,
        sam_score: float,
        mask: np.ndarray,
        img_w: int,
        img_h: int,
        overlap_penalty: float = 0.0,
    ) -> float:
        """
        Combines SAM model probability score, spatial prior score, and overlap penalties:
        Final Confidence = (0.50 * SAM_score + 0.40 * SpatialPrior + 0.10 * Shape) - OverlapPenalty
        """
        spatial_prior = cls.compute_spatial_prior(region_type, mask, img_w, img_h)
        
        # Calculate shape coherence (compactness / solidity)
        total_pixels = np.sum(mask)
        if total_pixels == 0:
            return 0.0

        y_indices, x_indices = np.where(mask)
        bbox_area = (np.max(y_indices) - np.min(y_indices) + 1) * (np.max(x_indices) - np.min(x_indices) + 1)
        solidity = min(1.0, total_pixels / max(1, bbox_area))
        
        raw_confidence = (
            0.50 * float(sam_score) +
            0.35 * float(spatial_prior) +
            0.15 * float(solidity)
        ) - float(overlap_penalty)

        return float(np.clip(round(raw_confidence, 2), 0.05, 0.98))

    @staticmethod
    def get_color_for_region(region_type: str, index: int = 0) -> str:
        """Returns a distinct hex color for the region type."""
        palette = REGION_PALETTES.get(region_type, ["#6366f1"])
        return palette[index % len(palette)]

# Global classifier instance
region_classifier = RegionClassifier()

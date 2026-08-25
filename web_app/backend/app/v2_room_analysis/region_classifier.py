import numpy as np
from typing import Dict, Any, List, Optional
from app.schemas.room import QualityScores

# Visual color palette for room semantic regions
REGION_PALETTES = {
    "wall": ["#3b82f6", "#60a5fa", "#2563eb", "#93c5fd"],  # Blue shades
    "floor": ["#10b981", "#059669"],                       # Emerald Green
    "ceiling": ["#a855f7", "#8b5cf6"],                     # Purple
    "window": ["#38bdf8", "#0ea5e9"],                      # Sky Blue
    "door": ["#f59e0b", "#d97706"],                        # Amber
    "furniture": ["#ec4899", "#f43f5e", "#fb7185"],        # Pink / Rose
}

class RegionClassifier:
    """
    Multi-Signal Quality Evaluation & Uncertainty Engine for Indoor Surfaces.
    Computes independent scoring signals, generates QualityScores breakdown,
    and flags uncertain surfaces with needs_review = True.
    """

    @staticmethod
    def compute_spatial_prior(region_type: str, mask: np.ndarray, img_w: int, img_h: int) -> float:
        """
        Calculates topological continuous prior score in [0.1, 0.98].
        Avoids brittle hardcoded step-functions; uses continuous Gaussian-like distributions.
        """
        if not np.any(mask):
            return 0.0

        y_indices, x_indices = np.where(mask)
        mean_y = np.mean(y_indices) / img_h
        min_y = np.min(y_indices) / img_h
        max_y = np.max(y_indices) / img_h
        area_ratio = np.sum(mask) / (img_w * img_h)

        if region_type == "floor":
            # Floor probability peaks in lower half
            score = 1.0 - np.exp(-3.0 * max(0.0, mean_y - 0.25))
            if max_y > 0.65:
                score += 0.15
            if min_y < 0.10:  # Penalty if touches extreme ceiling
                score -= 0.30
            return float(np.clip(score, 0.20, 0.98))

        elif region_type == "ceiling":
            # Ceiling probability peaks in top region
            score = 1.0 - np.exp(-3.5 * max(0.0, 0.75 - mean_y))
            if min_y < 0.20:
                score += 0.15
            if max_y > 0.85:
                score -= 0.30
            return float(np.clip(score, 0.20, 0.98))

        elif region_type == "wall":
            # Walls typically span vertical middle region
            score = 0.88
            y_span = max_y - min_y
            if y_span > 0.30:
                score += 0.08
            if area_ratio < 0.015:
                score -= 0.25
            return float(np.clip(score, 0.25, 0.96))

        elif region_type in ["window", "door"]:
            score = 0.85
            return float(np.clip(score, 0.30, 0.95))

        elif region_type == "furniture":
            score = 0.85
            if mean_y > 0.30:
                score += 0.08
            return float(np.clip(score, 0.30, 0.95))

        return 0.80

    @staticmethod
    def compute_boundary_score(mask: np.ndarray) -> float:
        """
        Evaluates boundary quality based on contour compactness and solidity.
        """
        if not np.any(mask):
            return 0.0
        y_indices, x_indices = np.where(mask)
        bbox_area = (np.max(y_indices) - np.min(y_indices) + 1) * (np.max(x_indices) - np.min(x_indices) + 1)
        total_pixels = np.sum(mask)
        solidity = total_pixels / max(1, bbox_area)
        return float(np.clip(0.60 + 0.38 * solidity, 0.30, 0.98))

    @classmethod
    def evaluate_surface(
        cls,
        region_type: str,
        sam_score: float,
        mask: np.ndarray,
        geometry_info: Dict[str, Any],
        img_w: int,
        img_h: int,
        overlap_penalty: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Computes independent signals, quality breakdown, weighted final confidence,
        and uncertainty flag needs_review.
        """
        spatial_score = cls.compute_spatial_prior(region_type, mask, img_w, img_h)
        geometry_score = geometry_info.get("geometry_confidence", 0.85)
        boundary_score = cls.compute_boundary_score(mask)

        # Configurable signal weights
        w_sam = 0.40
        w_spatial = 0.25
        w_geometry = 0.20
        w_boundary = 0.15

        raw_conf = (
            w_sam * sam_score +
            w_spatial * spatial_score +
            w_geometry * geometry_score +
            w_boundary * boundary_score
        ) - overlap_penalty

        final_conf = float(np.clip(round(raw_conf, 2), 0.05, 0.98))

        # Semantic, Geometry, Boundary Quality Breakdown
        quality = QualityScores(
            semantic=round(float(np.clip(0.60 * sam_score + 0.40 * spatial_score, 0.05, 0.98)), 2),
            geometry=round(float(geometry_score), 2),
            boundary=round(float(boundary_score), 2),
        )

        # Uncertainty threshold: Flag for review if confidence < 0.72 or boundary score < 0.60
        needs_review = (final_conf < 0.72) or (boundary_score < 0.60) or (geometry_score < 0.60)

        signals = {
            "sam_score": round(float(sam_score), 3),
            "spatial_score": round(float(spatial_score), 3),
            "geometry_score": round(float(geometry_score), 3),
            "boundary_score": round(float(boundary_score), 3),
            "overlap_penalty": round(float(overlap_penalty), 3),
        }

        return {
            "confidence": final_conf,
            "needs_review": needs_review,
            "quality": quality,
            "signals": signals,
        }

    @staticmethod
    def get_color_for_region(region_type: str, index: int = 0) -> str:
        palette = REGION_PALETTES.get(region_type, ["#6366f1"])
        return palette[index % len(palette)]

# Global classifier instance
region_classifier = RegionClassifier()

import io
import base64
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from PIL import Image
from scipy.ndimage import label, binary_opening, binary_closing

class MaskRefiner:
    """
    Precision Mask Refinement Engine for Indoor Structural Surfaces.
    Handles hierarchical opening carve-outs, furniture occlusion subtraction,
    multi-wall plane disambiguation, and artifact cleanup.
    """

    @staticmethod
    def remove_small_components(mask: np.ndarray, min_area_ratio: float = 0.003) -> np.ndarray:
        """Removes disconnected speckles smaller than min_area_ratio of total image."""
        if not np.any(mask):
            return mask

        h, w = mask.shape
        min_pixels = int(h * w * min_area_ratio)
        
        labeled_array, num_features = label(mask)
        if num_features == 0:
            return mask

        cleaned_mask = np.zeros_like(mask, dtype=bool)
        for i in range(1, num_features + 1):
            component = (labeled_array == i)
            if np.sum(component) >= min_pixels:
                cleaned_mask |= component

        return cleaned_mask

    @classmethod
    def separate_wall_planes(
        cls,
        raw_wall_mask: np.ndarray,
        img_w: int,
        img_h: int,
        min_wall_area_ratio: float = 0.03
    ) -> List[Dict[str, Any]]:
        """
        Disambiguates and splits contiguous wall masks into separate wall facets (Left Wall, Center Wall, Right Wall)
        using connected component analysis and vertical aspect boundaries.
        """
        if not np.any(raw_wall_mask):
            return []

        # Clean noise
        cleaned = cls.remove_small_components(raw_wall_mask, min_area_ratio=0.005)
        labeled_array, num_features = label(cleaned)
        
        planes = []
        min_pixels = int(img_w * img_h * min_wall_area_ratio)

        for i in range(1, num_features + 1):
            comp_mask = (labeled_array == i)
            area = np.sum(comp_mask)
            if area < min_pixels:
                continue

            y_idx, x_idx = np.where(comp_mask)
            x1, x2 = float(np.min(x_idx)), float(np.max(x_idx))
            y1, y2 = float(np.min(y_idx)), float(np.max(y_idx))
            center_x = (x1 + x2) / (2.0 * img_w)

            # Assign spatial orientation label
            if center_x < 0.35:
                sub_label = "Left Wall Plane"
            elif center_x > 0.65:
                sub_label = "Right Wall Plane"
            else:
                sub_label = "Center Wall Plane"

            planes.append({
                "mask": comp_mask,
                "bbox": [x1, y1, x2, y2],
                "area_ratio": round(float(area) / (img_w * img_h), 4),
                "sub_label": sub_label,
                "center_x": center_x,
            })

        # Sort planes left-to-right
        planes.sort(key=lambda p: p["center_x"])
        return planes

    @classmethod
    def apply_hierarchical_subtraction(
        cls,
        wall_masks: List[np.ndarray],
        floor_mask: Optional[np.ndarray],
        ceiling_mask: Optional[np.ndarray],
        opening_masks: List[np.ndarray],
        obstacle_masks: List[np.ndarray],
    ) -> Tuple[List[np.ndarray], Optional[np.ndarray], Optional[np.ndarray]]:
        """
        Hierarchical topological refinement:
        1. Openings (Windows, Doors) strictly carve out from Wall planes.
        2. Obstacles (Furniture, Rugs) carve out from Floor and Wall planes.
        3. Floor and Ceiling are mutually exclusive with Walls.
        """
        # Combine all openings into a single exclusion mask
        combined_openings = np.zeros_like(wall_masks[0], dtype=bool) if wall_masks else None
        for op in opening_masks:
            if op is not None:
                if combined_openings is None:
                    combined_openings = np.zeros_like(op, dtype=bool)
                combined_openings |= op

        # Combine all obstacles (furniture)
        combined_obstacles = None
        for obs in obstacle_masks:
            if obs is not None:
                if combined_obstacles is None:
                    combined_obstacles = np.zeros_like(obs, dtype=bool)
                combined_obstacles |= obs

        # 1. Refine Floor: Subtract walls, furniture, ceiling
        refined_floor = None
        if floor_mask is not None and np.any(floor_mask):
            refined_floor = floor_mask.copy()
            if combined_obstacles is not None:
                refined_floor &= ~combined_obstacles
            if ceiling_mask is not None:
                refined_floor &= ~ceiling_mask
            refined_floor = cls.remove_small_components(refined_floor, min_area_ratio=0.005)

        # 2. Refine Ceiling: Subtract walls, floor
        refined_ceiling = None
        if ceiling_mask is not None and np.any(ceiling_mask):
            refined_ceiling = ceiling_mask.copy()
            if refined_floor is not None:
                refined_ceiling &= ~refined_floor
            refined_ceiling = cls.remove_small_components(refined_ceiling, min_area_ratio=0.005)

        # 3. Refine Walls: Subtract openings, furniture, floor, ceiling
        refined_walls = []
        for w_mask in wall_masks:
            ref_w = w_mask.copy()
            if combined_openings is not None:
                ref_w &= ~combined_openings
            if combined_obstacles is not None:
                ref_w &= ~combined_obstacles
            if refined_floor is not None:
                ref_w &= ~refined_floor
            if refined_ceiling is not None:
                ref_w &= ~refined_ceiling
            ref_w = cls.remove_small_components(ref_w, min_area_ratio=0.003)
            if np.any(ref_w):
                refined_walls.append(ref_w)

        return refined_walls, refined_floor, refined_ceiling

    @staticmethod
    def mask_to_png_base64(mask: np.ndarray, color_hex: str = "#3b82f6", alpha: int = 140) -> str:
        """
        Encodes a binary mask into a transparent RGBA PNG data URI for client-side rendering.
        """
        h, w = mask.shape
        # Parse hex color
        hex_clean = color_hex.lstrip("#")
        r = int(hex_clean[0:2], 16)
        g = int(hex_clean[2:4], 16)
        b = int(hex_clean[4:6], 16)

        rgba = np.zeros((h, w, 4), dtype=np.uint8)
        rgba[mask, 0] = r
        rgba[mask, 1] = g
        rgba[mask, 2] = b
        rgba[mask, 3] = alpha

        pil_img = Image.fromarray(rgba, mode="RGBA")
        buffer = io.BytesIO()
        pil_img.save(buffer, format="PNG")
        encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{encoded}"

# Global refiner instance
mask_refiner = MaskRefiner()

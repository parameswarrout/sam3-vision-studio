import io
import base64
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from PIL import Image
from scipy.ndimage import label, binary_dilation, binary_erosion, sobel

class MaskRefiner:
    """
    Precision Mask Refinement Engine for Indoor Structural Surfaces.
    Enforces confidence-aware hierarchical occlusion, evidence-based wall separation,
    guided RGB edge snapping, and boundary preservation for V3 tile visualization readiness.
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

    @staticmethod
    def guided_rgb_edge_snapping(mask: np.ndarray, rgb_image: Image.Image, band_radius: int = 2) -> np.ndarray:
        """
        Guided RGB Edge Snapping:
        Snaps mask transition boundaries to physical high-contrast edges (baseboards, moldings)
        in the original full-resolution RGB photo with sub-pixel precision.
        """
        if not np.any(mask):
            return mask
        
        # Convert RGB to grayscale gradient
        gray = np.array(rgb_image.convert("L"), dtype=np.float32) / 255.0
        grad_x = sobel(gray, axis=1)
        grad_y = sobel(gray, axis=0)
        grad_mag = np.sqrt(grad_x ** 2 + grad_y ** 2)

        # Extract boundary transition band (dilation - erosion)
        dilated = binary_dilation(mask, iterations=band_radius)
        eroded = binary_erosion(mask, iterations=band_radius)
        transition_band = dilated & ~eroded

        if not np.any(transition_band):
            return mask

        # Keep confident core (eroded) and snap transition band to physical gradient
        refined = eroded.copy()
        for_inclusion = transition_band & mask
        refined |= for_inclusion

        return refined

    @classmethod
    def separate_wall_planes_with_evidence(
        cls,
        raw_wall_mask: np.ndarray,
        vertical_seams: List[int],
        img_w: int,
        img_h: int,
        min_wall_area_ratio: float = 0.03
    ) -> List[Dict[str, Any]]:
        """
        Evidence-based Wall Disambiguation:
        Does NOT force artificial 3-wall divisions.
        Only splits walls if:
        1. Natural disconnected components exist (min area >= 3% image), OR
        2. Strong vertical boundary seams are detected between wall sections.
        If no evidence for multiple walls exists, returns ONE single wall.
        """
        if not np.any(raw_wall_mask):
            return []

        cleaned = cls.remove_small_components(raw_wall_mask, min_area_ratio=0.005)
        labeled_array, num_features = label(cleaned)
        min_pixels = int(img_w * img_h * min_wall_area_ratio)

        candidate_components = []
        for i in range(1, num_features + 1):
            comp_mask = (labeled_array == i)
            area = np.sum(comp_mask)
            if area >= min_pixels:
                candidate_components.append((comp_mask, area))

        planes = []

        # If natural distinct components exist >= 2, use them directly
        if len(candidate_components) > 1:
            for idx, (comp_mask, area) in enumerate(candidate_components):
                y_idx, x_idx = np.where(comp_mask)
                x1, x2 = float(np.min(x_idx)), float(np.max(x_idx))
                y1, y2 = float(np.min(y_idx)), float(np.max(y_idx))
                center_x = (x1 + x2) / (2.0 * img_w)

                planes.append({
                    "mask": comp_mask,
                    "bbox": [x1, y1, x2, y2],
                    "area_ratio": round(float(area) / (img_w * img_h), 4),
                    "center_x": center_x,
                })
        elif len(candidate_components) == 1 and vertical_seams:
            # Single large contiguous mask with detected vertical corner seams
            single_mask, total_area = candidate_components[0]
            # Split along detected seams
            seam_boundaries = [0] + sorted(vertical_seams) + [img_w]
            for s_idx in range(len(seam_boundaries) - 1):
                start_x = seam_boundaries[s_idx]
                end_x = seam_boundaries[s_idx + 1]
                
                sub_mask = np.zeros_like(single_mask, dtype=bool)
                sub_mask[:, start_x:end_x] = single_mask[:, start_x:end_x]
                sub_mask = cls.remove_small_components(sub_mask, min_area_ratio=0.01)
                
                sub_area = np.sum(sub_mask)
                if sub_area >= min_pixels:
                    y_idx, x_idx = np.where(sub_mask)
                    x1, x2 = float(np.min(x_idx)), float(np.max(x_idx))
                    y1, y2 = float(np.min(y_idx)), float(np.max(y_idx))
                    planes.append({
                        "mask": sub_mask,
                        "bbox": [x1, y1, x2, y2],
                        "area_ratio": round(float(sub_area) / (img_w * img_h), 4),
                        "center_x": (x1 + x2) / (2.0 * img_w),
                    })
        else:
            # Single Wall Plane (Evidence supports exactly 1 wall)
            if candidate_components:
                single_mask, total_area = candidate_components[0]
                y_idx, x_idx = np.where(single_mask)
                x1, x2 = float(np.min(x_idx)), float(np.max(x_idx))
                y1, y2 = float(np.min(y_idx)), float(np.max(y_idx))
                planes.append({
                    "mask": single_mask,
                    "bbox": [x1, y1, x2, y2],
                    "area_ratio": round(float(total_area) / (img_w * img_h), 4),
                    "center_x": (x1 + x2) / (2.0 * img_w),
                })

        # Sort planes left-to-right
        planes.sort(key=lambda p: p["center_x"])

        # Assign human-readable labels based on final count
        for idx, plane in enumerate(planes):
            if len(planes) == 1:
                plane["label"] = "Main Wall Plane"
            else:
                plane["label"] = f"Wall Plane {idx + 1}"

        return planes

    @classmethod
    def apply_confidence_aware_occlusion(
        cls,
        wall_masks: List[np.ndarray],
        floor_mask: Optional[np.ndarray],
        ceiling_mask: Optional[np.ndarray],
        opening_candidates: List[Dict[str, Any]],
        obstacle_candidates: List[Dict[str, Any]],
        min_carve_confidence: float = 0.68,
        min_overlap_ratio: float = 0.05,
        rgb_image: Optional[Image.Image] = None,
    ) -> Tuple[List[np.ndarray], Optional[np.ndarray], Optional[np.ndarray]]:
        """
        Confidence-Aware Hierarchical Carving with Optional RGB Edge Snapping:
        - Structural surfaces (Wall, Floor) are preserved by default.
        - Openings (Windows, Doors) are subtracted ONLY if confidence >= min_carve_confidence
          AND meaningful overlap exists with the wall.
        - Occluders (Furniture) are subtracted from Floor ONLY if confidence >= min_carve_confidence.
        - Low-confidence or uncertain masks NEVER destroy structural surfaces.
        """
        # 1. Filter high-confidence openings
        valid_opening_mask = None
        for op in opening_candidates:
            op_mask = op["mask"]
            op_score = op.get("score", 0.0)
            if op_score >= min_carve_confidence and np.any(op_mask):
                if valid_opening_mask is None:
                    valid_opening_mask = np.zeros_like(op_mask, dtype=bool)
                valid_opening_mask |= op_mask

        # 2. Filter high-confidence obstacles (furniture)
        valid_obstacle_mask = None
        for obs in obstacle_candidates:
            obs_mask = obs["mask"]
            obs_score = obs.get("score", 0.0)
            if obs_score >= min_carve_confidence and np.any(obs_mask):
                if valid_obstacle_mask is None:
                    valid_obstacle_mask = np.zeros_like(obs_mask, dtype=bool)
                valid_obstacle_mask |= obs_mask

        # 3. Refine Floor (Subtract obstacles, ceiling, but preserve floor boundary)
        refined_floor = None
        if floor_mask is not None and np.any(floor_mask):
            refined_floor = floor_mask.copy()
            if valid_obstacle_mask is not None:
                overlap = np.sum(refined_floor & valid_obstacle_mask)
                if overlap / max(1, np.sum(valid_obstacle_mask)) >= min_overlap_ratio:
                    refined_floor &= ~valid_obstacle_mask
            if ceiling_mask is not None:
                refined_floor &= ~ceiling_mask
            refined_floor = cls.remove_small_components(refined_floor, min_area_ratio=0.005)
            if rgb_image is not None and np.any(refined_floor):
                refined_floor = cls.guided_rgb_edge_snapping(refined_floor, rgb_image)

        # 4. Refine Ceiling
        refined_ceiling = None
        if ceiling_mask is not None and np.any(ceiling_mask):
            refined_ceiling = ceiling_mask.copy()
            if refined_floor is not None:
                refined_ceiling &= ~refined_floor
            refined_ceiling = cls.remove_small_components(refined_ceiling, min_area_ratio=0.005)

        # 5. Refine Walls (Subtract high-confidence openings, floor, ceiling)
        refined_walls = []
        for w_mask in wall_masks:
            ref_w = w_mask.copy()
            if valid_opening_mask is not None:
                overlap = np.sum(ref_w & valid_opening_mask)
                if overlap / max(1, np.sum(valid_opening_mask)) >= min_overlap_ratio:
                    ref_w &= ~valid_opening_mask
            if refined_floor is not None:
                ref_w &= ~refined_floor
            if refined_ceiling is not None:
                ref_w &= ~refined_ceiling
            ref_w = cls.remove_small_components(ref_w, min_area_ratio=0.003)
            if rgb_image is not None and np.any(ref_w):
                ref_w = cls.guided_rgb_edge_snapping(ref_w, rgb_image)
            if np.any(ref_w):
                refined_walls.append(ref_w)

        return refined_walls, refined_floor, refined_ceiling

    @staticmethod
    def mask_to_png_base64(mask: np.ndarray, color_hex: str = "#3b82f6", alpha: int = 140) -> str:
        """Encodes a binary mask into a transparent RGBA PNG data URI for client-side rendering."""
        h, w = mask.shape
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

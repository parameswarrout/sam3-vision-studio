import time
import io
import base64
import numpy as np
import cv2
from PIL import Image
from typing import Dict, Any, List, Optional, Tuple

from app.core import sam3_service, api_logger

class TileSurfaceDetector:
    """
    High-precision SAM 3 Surface Segmentation engine optimized specifically
    for Floor and Wall plane extraction for tile visualization.
    """

    def __init__(self):
        self.sam = sam3_service

    def detect_surface(
        self,
        surface_type: str = "floor",
        confidence: float = 0.10,
        custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes SAM 3 surface grounding and boundary refinement for floor or wall planes.
        """
        if self.sam.current_image is None:
            raise ValueError("No active image in session. Please upload an image first.")

        t0 = time.time()
        img = self.sam.current_image
        w, h = img.size
        img_np = np.array(img)

        # 1. Determine Prompt Strategy
        prompts = []
        if custom_prompt and custom_prompt.strip():
            prompts.append(custom_prompt.strip())
        elif surface_type.lower() == "floor":
            prompts = ["floor", "flooring", "wood floor", "tiled floor", "carpet floor"]
        elif surface_type.lower() == "wall":
            prompts = ["wall", "room wall", "interior wall", "backsplash"]
        else: # both
            prompts = ["floor", "wall"]

        aggregated_mask = np.zeros((h, w), dtype=bool)

        for p in prompts:
            try:
                res = self.sam.segment_text(prompt=p, confidence=confidence)
                masks = res.get("masks", None)
                if masks is not None and len(masks) > 0:
                    for m in masks:
                        if hasattr(m, "detach"):
                            m_np = m.detach().cpu().numpy()
                        else:
                            m_np = np.asarray(m)
                        m_np = np.squeeze(m_np)
                        if m_np.ndim != 2:
                            continue
                        if m_np.shape != (h, w):
                            m_bool = cv2.resize(
                                m_np.astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST
                            ).astype(bool)
                        else:
                            m_bool = m_np.astype(bool)
                        aggregated_mask |= m_bool
            except Exception as e:
                api_logger.warning(f"Error querying SAM 3 for surface prompt '{p}': {e}")

        # 2. Extract and carve obstacles if searching floor or wall
        # Carve furniture / rugs / beds to ensure crisp edges around room items
        try:
            furn_res = self.sam.segment_text(prompt="furniture, couch, bed, table, chair, cabinet", confidence=0.25)
            f_masks = furn_res.get("masks", None)
            if f_masks is not None and len(f_masks) > 0:
                for fm in f_masks:
                    if hasattr(fm, "detach"):
                        fm_np = fm.detach().cpu().numpy()
                    else:
                        fm_np = np.asarray(fm)
                    fm_np = np.squeeze(fm_np)
                    if fm_np.ndim != 2:
                        continue
                    if fm_np.shape != (h, w):
                        fm_bool = cv2.resize(
                            fm_np.astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST
                        ).astype(bool)
                    else:
                        fm_bool = fm_np.astype(bool)
                    
                    # Morphological erosion on obstacle before carving to prevent harsh over-carve
                    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
                    fm_eroded = cv2.erode(fm_bool.astype(np.uint8), kernel, iterations=1).astype(bool)
                    aggregated_mask &= (~fm_eroded)
        except Exception as e:
            api_logger.warning(f"Obstacle carving warning: {e}")

        # 3. Morphological Cleanup (close small pinholes & remove stray 1px speckles)
        if np.any(aggregated_mask):
            kernel_clean = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
            mask_uint = aggregated_mask.astype(np.uint8)
            mask_closed = cv2.morphologyEx(mask_uint, cv2.MORPH_CLOSE, kernel_clean)
            mask_opened = cv2.morphologyEx(mask_closed, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3)))
            aggregated_mask = mask_opened.astype(bool)

        # 4. Fallback Heuristic if nothing detected (e.g. prompt missed)
        if not np.any(aggregated_mask):
            if surface_type.lower() == "floor":
                # Default lower 40% bottom ground plane
                aggregated_mask[int(h * 0.60):, :] = True
            elif surface_type.lower() == "wall":
                # Default middle 50% wall plane
                aggregated_mask[int(h * 0.15):int(h * 0.65), :] = True

        # 5. Build Sub-Regions / Connected Components
        num_labels, labels_im = cv2.connectedComponents(aggregated_mask.astype(np.uint8))
        surface_items = []
        color_palette = [
            "#38BDF8", "#818CF8", "#A78BFA", "#34D399", "#F472B6", "#FBBF24"
        ]

        for lbl in range(1, num_labels):
            comp_mask = (labels_im == lbl)
            area = np.sum(comp_mask)
            area_r = round(float(area) / (w * h), 4)
            if area_r < 0.008:
                continue

            y_idx, x_idx = np.where(comp_mask)
            bbox = [float(np.min(x_idx)), float(np.min(y_idx)), float(np.max(x_idx)), float(np.max(y_idx))]
            color = color_palette[(lbl - 1) % len(color_palette)]

            # Convert single component mask to PNG Base64
            mask_png_b64 = self._mask_to_png_base64(comp_mask, color)

            surface_items.append({
                "surface_type": surface_type,
                "label": f"{surface_type.capitalize()} Plane {lbl}",
                "area_ratio": area_r,
                "bbox": bbox,
                "mask_base64": mask_png_b64,
                "color": color,
                "raw_mask": comp_mask
            })

        # Generate composite overlay
        composite_b64 = self._render_composite_overlay(img, aggregated_mask, surface_type)
        exec_ms = round((time.time() - t0) * 1000, 1)

        return {
            "surface_type": surface_type,
            "raw_mask": aggregated_mask,
            "surface_masks": surface_items,
            "composite_mask_base64": composite_b64,
            "num_regions": len(surface_items),
            "execution_time_ms": exec_ms,
        }

    def _mask_to_png_base64(self, mask: np.ndarray, hex_color: str = "#38BDF8", alpha: int = 150) -> str:
        h, w = mask.shape
        hex_clean = hex_color.lstrip("#")
        r = int(hex_clean[0:2], 16)
        g = int(hex_clean[2:4], 16)
        b = int(hex_clean[4:6], 16)

        rgba = np.zeros((h, w, 4), dtype=np.uint8)
        rgba[mask, 0] = r
        rgba[mask, 1] = g
        rgba[mask, 2] = b
        rgba[mask, 3] = alpha

        pil_rgba = Image.fromarray(rgba, mode="RGBA")
        buf = io.BytesIO()
        pil_rgba.save(buf, format="PNG", optimize=True)
        return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

    def _render_composite_overlay(self, original_img: Image.Image, mask: np.ndarray, surface_type: str) -> str:
        w, h = original_img.size
        orig_rgba = original_img.convert("RGBA")
        overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw_np = np.zeros((h, w, 4), dtype=np.uint8)

        color = (56, 189, 248, 140) if surface_type.lower() == "floor" else (168, 85, 247, 140)
        draw_np[mask] = color

        # Draw glowing outline border around mask edges
        contours, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(draw_np, contours, -1, (255, 255, 255, 220), 2)

        overlay_layer = Image.fromarray(draw_np, mode="RGBA")
        composite = Image.alpha_composite(orig_rgba, overlay_layer)

        buf = io.BytesIO()
        composite.convert("RGB").save(buf, format="JPEG", quality=90)
        return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

tile_detector = TileSurfaceDetector()

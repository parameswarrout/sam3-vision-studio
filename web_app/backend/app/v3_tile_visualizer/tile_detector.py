import io
import time
import base64
import numpy as np
import cv2
from PIL import Image
from typing import Dict, Any, List, Optional

from app.core import sam3_service, api_logger

SURFACE_PROMPTS = {
    "floor": [
        "floor",
        "flooring",
        "wood floor",
        "tiled floor",
        "carpet floor"
    ],
    "wall": [
        "wall",
        "room wall",
        "interior wall",
        "backsplash"
    ]
}

OBSTACLE_PROMPTS = [
    "furniture, couch, bed, table, chair, cabinet, counter"
]

class SurfaceTileDetectorV3:
    """
    SAM 3 Multi-Query Open-Vocabulary Neural Surface Grounder (V3.0).
    Executes ensemble text grounding with negative obstacle subtraction.
    """

    def detect_surface(
        self,
        surface_type: str = "floor",
        confidence: float = 0.12,
        custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        t0 = time.time()

        if sam3_service.current_image is None:
            raise ValueError("No active image in session. Please upload a room photo first.")

        w = sam3_service.current_image.width
        h = sam3_service.current_image.height

        surface_key = surface_type.lower().strip()
        if surface_key == "both":
            prompts = SURFACE_PROMPTS["floor"] + SURFACE_PROMPTS["wall"]
        else:
            prompts = SURFACE_PROMPTS.get(surface_key, [surface_key])

        if custom_prompt and custom_prompt.strip():
            prompts = [custom_prompt.strip()] + prompts

        api_logger.info(f"[V3 TileDetector] Grounding queries: {prompts} (conf={confidence:.2f})")

        combined_surface_mask = np.zeros((h, w), dtype=bool)
        surface_regions = []

        for p in prompts:
            try:
                res = sam3_service.segment_text(prompt=p, confidence=confidence)
                masks = res.get("masks", None)
                boxes = res.get("boxes", [])

                if masks is not None:
                    if hasattr(masks, "cpu"):
                        masks_np = masks.cpu().numpy()
                    else:
                        masks_np = np.array(masks)

                    for idx, m in enumerate(masks_np):
                        m_bool = m.squeeze().astype(bool)
                        if m_bool.shape != (h, w):
                            m_bool = cv2.resize(m_bool.astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST).astype(bool)

                        area = np.sum(m_bool)
                        if area < (w * h * 0.005):
                            continue

                        combined_surface_mask = np.logical_or(combined_surface_mask, m_bool)
                        bbox = boxes[idx] if idx < len(boxes) else [0, 0, w, h]

                        buf = io.BytesIO()
                        Image.fromarray((m_bool * 255).astype(np.uint8), mode="L").save(buf, format="PNG")
                        m_b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

                        surface_regions.append({
                            "surface_type": surface_key,
                            "label": f"{p} (region {len(surface_regions)+1})",
                            "area_ratio": round(float(area) / float(w * h), 4),
                            "bbox": [float(b) for b in bbox] if isinstance(bbox, (list, np.ndarray)) else [0, 0, w, h],
                            "mask_base64": m_b64,
                            "color": "#10B981" if surface_key == "floor" else "#8B5CF6"
                        })
            except Exception as e:
                api_logger.warning(f"[V3 TileDetector] Query '{p}' failed: {e}")

        # Negative Obstacle Carving
        try:
            for obs_p in OBSTACLE_PROMPTS:
                obs_res = sam3_service.segment_text(prompt=obs_p, confidence=0.25)
                obs_masks = obs_res.get("masks", None)
                if obs_masks is not None:
                    if hasattr(obs_masks, "cpu"):
                        obs_np = obs_masks.cpu().numpy()
                    else:
                        obs_np = np.array(obs_masks)
                    for om in obs_np:
                        om_bool = om.squeeze().astype(bool)
                        if om_bool.shape != (h, w):
                            om_bool = cv2.resize(om_bool.astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST).astype(bool)
                        combined_surface_mask = np.logical_and(combined_surface_mask, np.logical_not(om_bool))
        except Exception as e:
            api_logger.warning(f"[V3 TileDetector] Obstacle carving warning: {e}")

        # Generate composite overlay
        orig_np = np.array(sam3_service.current_image.convert("RGB"))
        overlay = orig_np.copy()
        tint_color = [16, 185, 129] if surface_key == "floor" else [139, 92, 246]
        overlay[combined_surface_mask] = (
            overlay[combined_surface_mask] * 0.55 + np.array(tint_color) * 0.45
        ).astype(np.uint8)

        # Draw glowing edge contours
        contours, _ = cv2.findContours(
            combined_surface_mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        cv2.drawContours(overlay, contours, -1, (255, 255, 255), 2)

        buf = io.BytesIO()
        Image.fromarray(overlay).save(buf, format="JPEG", quality=90)
        comp_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

        exec_ms = round((time.time() - t0) * 1000, 1)
        api_logger.info(
            f"[V3 TileDetector] Grounding completed in {exec_ms}ms (found {len(surface_regions)} regions, total area={np.sum(combined_surface_mask)/(w*h):.1%})"
        )

        return {
            "surface_type": surface_key,
            "raw_mask": combined_surface_mask,
            "surface_masks": surface_regions,
            "composite_mask_base64": comp_b64,
            "num_regions": len(surface_regions),
            "execution_time_ms": exec_ms,
        }

tile_detector_v3 = SurfaceTileDetectorV3()

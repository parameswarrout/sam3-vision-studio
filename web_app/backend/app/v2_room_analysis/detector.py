import time
from typing import Dict, Any, List, Optional
import torch
import numpy as np
from PIL import Image

from app.core import sam3_service
from app.core.logger import model_logger

# Semantic concept groups for multi-prompt indoor candidate generation
CONCEPT_QUERIES = {
    "wall": ["wall", "interior wall"],
    "floor": ["floor", "flooring"],
    "ceiling": ["ceiling"],
    "window": ["window"],
    "door": ["door"],
    "furniture": ["furniture"],
}

class RoomDetector:
    """
    Orchestrates multi-concept semantic candidate generation using SAM 3's cached ViT embeddings.
    """

    def __init__(self):
        self.service = sam3_service

    def extract_candidates(self, image: Image.Image) -> Dict[str, Any]:
        """
        Sets the room image and runs concept queries against cached ViT feature embeddings.
        Returns extracted candidate masks and raw confidence scores grouped by category.
        """
        self.service.ensure_model()
        t0 = time.time()
        
        # 1. Embed image once
        img_state = self.service.processor.set_image(image)
        t_embed = time.time() - t0
        model_logger.info(f"[RoomDetector] Image embedded in {round(t_embed * 1000, 1)}ms ({image.width}x{image.height}px)")

        candidates = {
            "wall": [],
            "floor": [],
            "ceiling": [],
            "window": [],
            "door": [],
            "furniture": [],
        }

        # 2. Query each semantic concept group using the cached state
        query_timings = {}
        for category, queries in CONCEPT_QUERIES.items():
            t_cat_start = time.time()

            for q in queries:
                try:
                    # Thresholds tuned per category
                    threshold = 0.10 if category in ["wall", "floor"] else 0.15
                    self.service.processor.set_confidence_threshold(threshold)
                    
                    # Reset geometric prompt state to ensure pure open-vocabulary text query
                    img_state["geometric_prompt"] = self.service.model._get_dummy_prompt()
                    out = self.service.processor.set_text_prompt(prompt=q, state=img_state)
                    
                    masks = out.get("masks", None)
                    scores = out.get("scores", None)
                    boxes = out.get("boxes", None)

                    if masks is not None and len(masks) > 0:
                        # Convert PyTorch tensors to numpy
                        if isinstance(masks, torch.Tensor):
                            masks_np = masks.squeeze(1).cpu().numpy()
                        else:
                            masks_np = np.array(masks)

                        scores_np = scores.cpu().numpy() if isinstance(scores, torch.Tensor) else np.array(scores)
                        boxes_np = boxes.cpu().numpy() if isinstance(boxes, torch.Tensor) else np.array(boxes)

                        for idx in range(len(masks_np)):
                            m = masks_np[idx] > 0.5
                            if np.any(m):
                                s = float(scores_np[idx]) if idx < len(scores_np) else 0.85
                                b = boxes_np[idx].tolist() if idx < len(boxes_np) else [0.0, 0.0, float(image.width), float(image.height)]
                                candidates[category].append({
                                    "mask": m,
                                    "score": s,
                                    "bbox": b,
                                    "query": q,
                                })
                except Exception as e:
                    model_logger.warning(f"[RoomDetector] Query '{q}' error: {e}")

            query_timings[category] = round((time.time() - t_cat_start) * 1000, 1)

        model_logger.info(f"[RoomDetector] Candidate extraction complete in {round((time.time() - t0) * 1000, 1)}ms: "
                           f"walls={len(candidates['wall'])}, floors={len(candidates['floor'])}, "
                           f"windows={len(candidates['window'])}, doors={len(candidates['door'])}, "
                           f"furniture={len(candidates['furniture'])}")

        return {
            "candidates": candidates,
            "img_width": image.width,
            "img_height": image.height,
            "timings": query_timings,
        }

# Global detector instance
room_detector = RoomDetector()

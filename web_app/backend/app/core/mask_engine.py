import io
import base64
from typing import List, Optional, Tuple, Union
import numpy as np
import torch
from PIL import Image, ImageDraw, ImageFont

# Distinct high-contrast palette for visual overlays
PALETTE = [
    (239, 68, 68),    # Red
    (34, 197, 94),    # Green
    (59, 130, 246),   # Blue
    (245, 158, 11),   # Amber
    (168, 85, 247),   # Purple
    (6, 182, 212),    # Cyan
    (236, 72, 153),   # Pink
    (20, 184, 166),   # Teal
]

class MaskEngine:
    """High-performance mask blending and visual overlay generator."""

    @staticmethod
    def pil_to_base64(image: Image.Image, format: str = "PNG") -> str:
        """Convert a PIL Image to a base64 encoded data URI."""
        buffered = io.BytesIO()
        image.save(buffered, format=format, optimize=True)
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return f"data:image/{format.lower()};base64,{img_str}"

    @staticmethod
    def base64_to_pil(data_uri: str) -> Image.Image:
        """Convert a base64 data URI to a PIL Image."""
        if "," in data_uri:
            data_uri = data_uri.split(",", 1)[1]
        image_bytes = base64.b64decode(data_uri)
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")

    @classmethod
    def render_overlay(
        cls,
        image: Image.Image,
        masks: Optional[Union[np.ndarray, torch.Tensor]] = None,
        boxes: Optional[Union[np.ndarray, torch.Tensor, List]] = None,
        labels: Optional[List[str]] = None,
        alpha: float = 0.45,
    ) -> Image.Image:
        """
        Overlay binary masks and bounding boxes onto an image with seamless alpha blending.
        """
        img_np = np.array(image.convert("RGB")).copy()
        height, width, _ = img_np.shape

        if masks is not None and len(masks) > 0:
            if isinstance(masks, torch.Tensor):
                masks = masks.detach().cpu().numpy()

            for idx, mask in enumerate(masks):
                # Ensure 2D mask
                if mask.ndim == 3:
                    mask = mask[0]

                mask_bool = mask > 0.5
                if mask_bool.shape[:2] != (height, width):
                    mask_pil = Image.fromarray((mask_bool * 255).astype(np.uint8))
                    mask_pil = mask_pil.resize((width, height), Image.NEAREST)
                    mask_bool = np.array(mask_pil) > 128

                color = np.array(PALETTE[idx % len(PALETTE)], dtype=np.uint8)
                img_np[mask_bool] = (
                    img_np[mask_bool] * (1.0 - alpha) + color * alpha
                ).astype(np.uint8)

        img_pil = Image.fromarray(img_np)
        draw = ImageDraw.Draw(img_pil)

        try:
            font = ImageFont.load_default()
        except Exception:
            font = None

        if boxes is not None and len(boxes) > 0:
            if isinstance(boxes, torch.Tensor):
                boxes = boxes.detach().cpu().numpy()

            for idx, box in enumerate(boxes):
                x1, y1, x2, y2 = [int(v) for v in box]
                color = PALETTE[idx % len(PALETTE)]
                # Draw bounding box
                draw.rectangle([x1, y1, x2, y2], outline=color, width=3)

                # Draw label tag
                if labels is not None and idx < len(labels):
                    label_text = str(labels[idx])
                    text_bbox = draw.textbbox((x1, max(y1 - 18, 0)), label_text, font=font)
                    draw.rectangle(text_bbox, fill=color)
                    draw.text((x1 + 2, max(y1 - 18, 0)), label_text, fill="white", font=font)

        return img_pil

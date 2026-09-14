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

    @classmethod
    def generate_cutouts(
        cls,
        image: Image.Image,
        masks: Optional[Union[np.ndarray, torch.Tensor]] = None,
        boxes: Optional[Union[np.ndarray, torch.Tensor, List]] = None,
        labels: Optional[List[str]] = None,
        padding: int = 16,
    ) -> Tuple[Optional[str], Optional[str], Optional[str], List[dict]]:
        """
        Extracts only the detected/segmented region from the image with transparent background.
        Returns:
            - cutout_base64: RGBA transparent PNG containing only the segmented region
            - cropped_cutout_base64: RGBA transparent PNG tightly cropped to bounding box with padding
            - mask_only_base64: Binary silhouette mask (black & white)
            - region_items: List of individual detected region dictionaries
        """
        if masks is None or len(masks) == 0:
            return None, None, None, []

        img_rgba = np.array(image.convert("RGBA")).copy()
        height, width, _ = img_rgba.shape

        if isinstance(masks, torch.Tensor):
            masks = masks.detach().cpu().numpy()

        combined_mask = np.zeros((height, width), dtype=bool)
        individual_masks = []

        for mask in masks:
            if isinstance(mask, torch.Tensor):
                mask = mask.detach().cpu().numpy()
            if mask.ndim == 3:
                mask = mask[0]
            mask_bool = mask > 0.5
            if mask_bool.shape[:2] != (height, width):
                mask_pil = Image.fromarray((mask_bool * 255).astype(np.uint8))
                mask_pil = mask_pil.resize((width, height), Image.NEAREST)
                mask_bool = np.array(mask_pil) > 128
            combined_mask |= mask_bool
            individual_masks.append(mask_bool)

        if not np.any(combined_mask):
            return None, None, None, []

        # 1. Full-frame RGBA cutout (background transparent)
        cutout_np = img_rgba.copy()
        cutout_np[~combined_mask, 3] = 0
        cutout_pil = Image.fromarray(cutout_np, "RGBA")
        cutout_base64 = cls.pil_to_base64(cutout_pil, format="PNG")

        # 2. Cropped cutout (tight bounding box with padding)
        y_indices, x_indices = np.where(combined_mask)
        y_min, y_max = int(np.min(y_indices)), int(np.max(y_indices))
        x_min, x_max = int(np.min(x_indices)), int(np.max(x_indices))

        cx1 = max(0, x_min - padding)
        cy1 = max(0, y_min - padding)
        cx2 = min(width, x_max + 1 + padding)
        cy2 = min(height, y_max + 1 + padding)

        cropped_pil = cutout_pil.crop((cx1, cy1, cx2, cy2))
        cropped_cutout_base64 = cls.pil_to_base64(cropped_pil, format="PNG")

        # 3. Binary silhouette mask (pure black & white)
        mask_rgb = np.zeros((height, width, 3), dtype=np.uint8)
        mask_rgb[combined_mask] = 255
        mask_pil = Image.fromarray(mask_rgb, "RGB")
        mask_only_base64 = cls.pil_to_base64(mask_pil, format="PNG")

        # 4. Individual region cutouts
        region_items = []
        for idx, m_bool in enumerate(individual_masks):
            reg_np = img_rgba.copy()
            reg_np[~m_bool, 3] = 0
            reg_pil = Image.fromarray(reg_np, "RGBA")

            ry, rx = np.where(m_bool)
            if len(ry) > 0:
                rx1 = max(0, int(np.min(rx)) - padding)
                ry1 = max(0, int(np.min(ry)) - padding)
                rx2 = min(width, int(np.max(rx)) + 1 + padding)
                ry2 = min(height, int(np.max(ry)) + 1 + padding)
                rcropped = reg_pil.crop((rx1, ry1, rx2, ry2))
                rbbox = [float(rx1), float(ry1), float(rx2), float(ry2)]
            else:
                rcropped = reg_pil
                rbbox = None

            label_str = labels[idx] if labels and idx < len(labels) else f"Region {idx + 1}"
            region_items.append({
                "index": idx,
                "label": label_str,
                "cutout_base64": cls.pil_to_base64(reg_pil, format="PNG"),
                "cropped_base64": cls.pil_to_base64(rcropped, format="PNG"),
                "bbox": rbbox,
            })

        return cutout_base64, cropped_cutout_base64, mask_only_base64, region_items

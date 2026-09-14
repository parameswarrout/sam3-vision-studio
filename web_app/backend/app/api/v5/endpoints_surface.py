import io
import base64
from pathlib import Path
import numpy as np
from PIL import Image
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional

from app.core import sam3_service, api_logger
from app.services.tile_engine.tile_catalog import TILE_CATALOG, get_tile_by_id
from app.services.surface_replacement import (
    surface_engine_v5,
    stage1_segmentation,
    stage2_geometry,
    stage3_intrinsic,
    stage4_materials,
    stage6_offline_catalog
)
from app.schemas.v5_surface import (
    V5DetectSurfaceRequest,
    V5DetectSurfaceResponse,
    V5RenderRequest,
    V5RenderResponse,
    V5OfflineVariantRequest,
    V5OfflineVariantResponse
)

router = APIRouter()

@router.get("/catalog", summary="Get PBR Material Catalog with Metric Dimensions")
async def get_pbr_catalog():
    """
    Returns full PBR catalog of tile SKUs with authored material properties and real-world metric dimensions.
    """
    return {
        "catalog": TILE_CATALOG,
        "total_skus": len(TILE_CATALOG),
        "engine": "V5 Physically-Based Rendering (Cook-Torrance GGX)"
    }

def _resolve_image(image_base64: Optional[str]) -> Image.Image:
    if image_base64 and len(image_base64) > 10:
        try:
            if "," in image_base64:
                image_base64 = image_base64.split(",", 1)[1]
            image_bytes = base64.b64decode(image_base64)
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            sam3_service.current_image = img
            return img
        except Exception as e:
            api_logger.warning(f"Failed to decode image_base64: {e}")

    if sam3_service.current_image is not None:
        return sam3_service.current_image

    # Multi-path search for default sample image
    base_file = Path(__file__).resolve()
    candidates = [
        base_file.parents[3] / "web_app" / "frontend" / "public" / "samples" / "living_room.jpg",
        base_file.parents[2] / "frontend" / "public" / "samples" / "living_room.jpg",
        Path("web_app/frontend/public/samples/living_room.jpg"),
        Path("public/samples/living_room.jpg"),
        Path("data/samples/living_room.jpg"),
    ]
    for c in candidates:
        if c.exists():
            img = Image.open(c).convert("RGB")
            sam3_service.current_image = img
            return img

    # Safe synthetic room fallback (Floor & Wall)
    dummy_np = np.full((384, 512, 3), 210, dtype=np.uint8)
    dummy_np[190:, :] = [160, 140, 120]
    img = Image.fromarray(dummy_np)
    sam3_service.current_image = img
    return img

def _parse_points(points: Optional[List[List[float]]], width: int, height: int):
    if not points or len(points) == 0:
        return None, None
    pts_list = []
    labels_list = []
    for p in points:
        px, py = float(p[0]), float(p[1])
        plabel = int(p[2]) if len(p) > 2 else 1
        if px <= 100.0 and py <= 100.0:
            px = (px / 100.0) * width
            py = (py / 100.0) * height
        pts_list.append([px, py])
        labels_list.append(plabel)
    return np.array(pts_list, dtype=np.float32), np.array(labels_list, dtype=np.int32)

@router.post("/detect-surface", response_model=V5DetectSurfaceResponse, summary="Stage 1: Multi-Prompt Surface Segmentation")
async def detect_surface(req: V5DetectSurfaceRequest):
    """
    Executes Stage 1: Multi-prompt SAM 3 ensemble + negative obstacle subtraction + closed-form alpha matting.
    """
    image_pil = _resolve_image(req.image_base64)
    image_np = np.array(image_pil.convert("RGB"))
    h, w = image_np.shape[:2]

    # Check for interactive prompt points
    custom_mask = None
    pts_arr, lbl_arr = _parse_points(req.points, w, h)
    if pts_arr is not None and getattr(sam3_service, "model", None) is not None:
        try:
            pts_res = sam3_service.segment_points(points=pts_arr, labels=lbl_arr)
            if "masks" in pts_res and pts_res["masks"] is not None:
                custom_mask = pts_res["masks"][0].squeeze().astype(bool)
        except Exception as e:
            api_logger.warning(f"[Stage 1] Point segmentation failed: {e}")

    res = stage1_segmentation.segment_surface(
        image_np=image_np,
        surface_type=req.surface_type,
        confidence=req.confidence,
        custom_prompt=req.custom_prompt
    )

    if custom_mask is not None:
        res["binary_mask"] = custom_mask
        res["alpha_matte"], res["trimap"] = stage1_segmentation.compute_alpha_matting(
            image_np, custom_mask, band_radius=4
        )

    # Generate visual overlay
    overlay = image_np.copy()
    mask = res["binary_mask"]
    tint = [16, 185, 129] if req.surface_type == "floor" else [139, 92, 246]
    overlay[mask] = (overlay[mask] * 0.55 + np.array(tint) * 0.45).astype(np.uint8)

    buf = io.BytesIO()
    Image.fromarray(overlay).save(buf, format="JPEG", quality=90)
    comp_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

    alpha_vis = (res["alpha_matte"] * 255.0).astype(np.uint8)
    buf_al = io.BytesIO()
    Image.fromarray(alpha_vis, mode="L").save(buf_al, format="PNG")
    al_b64 = "data:image/png;base64," + base64.b64encode(buf_al.getvalue()).decode("ascii")

    return V5DetectSurfaceResponse(
        surface_type=req.surface_type,
        num_regions=1 if np.any(mask) else 0,
        composite_mask_base64=comp_b64,
        alpha_matte_base64=al_b64,
        execution_time_ms=res["execution_time_ms"]
    )

@router.post("/render-replacement", response_model=V5RenderResponse, summary="Stages 1-5: Complete Physically-Based Surface Replacement")
async def render_replacement(req: V5RenderRequest):
    """
    Executes complete deterministic Stage 1-5 pipeline with Cook-Torrance BRDF and boundary-only compositing.
    Returns full render, 4-metric quality report, plane equation, light parameters, and diagnostic viewports.
    """
    image_pil = _resolve_image(req.image_base64)
    w, h = image_pil.size

    # Check for interactive prompt points
    custom_mask = None
    pts_arr, lbl_arr = _parse_points(req.points, w, h)
    if pts_arr is not None and getattr(sam3_service, "model", None) is not None:
        try:
            pts_res = sam3_service.segment_points(points=pts_arr, labels=lbl_arr)
            if "masks" in pts_res and pts_res["masks"] is not None:
                custom_mask = pts_res["masks"][0].squeeze().astype(bool)
        except Exception as e:
            api_logger.warning(f"[Stage 1] Point segmentation failed: {e}")

    res = surface_engine_v5.replace_surface(
        image_pil=image_pil,
        tile_id=req.tile_id,
        surface_type=req.surface_type,
        custom_prompt=req.custom_prompt,
        custom_mask_np=custom_mask,
        scale=req.scale,
        rotation_deg=req.rotation_deg,
        bump_strength=req.bump_strength,
        grout_width_mm=req.grout_width_mm,
        seam_blend_radius=req.seam_blend_radius,
        confidence=req.confidence,
        apply_geometric_feedback=req.apply_geometric_feedback
    )

    return V5RenderResponse(**res)

@router.post("/offline-catalog-generator", response_model=V5OfflineVariantResponse, summary="Stage 6: Offline Catalog Asset Generator")
async def generate_offline_variants(req: V5OfflineVariantRequest):
    """
    STAGE 6 TOOL: Generates texture variants offline with automated QA gate.
    NOTE: Zero generative diffusion models run during live user rendering.
    """
    res = stage6_offline_catalog.generate_variants_for_sku(
        base_sku_id=req.sku_id,
        num_variants=req.num_variants,
        qa_threshold=req.qa_threshold
    )
    return V5OfflineVariantResponse(**res)

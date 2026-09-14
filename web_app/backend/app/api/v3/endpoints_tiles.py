import io
import asyncio
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Response

from app.core import sam3_service, api_logger, session_manager
from app.schemas.v3_tile import (
    TileCatalogItemV3,
    SurfaceDetectRequestV3,
    SurfaceDetectResponseV3,
    TileRenderRequestV3,
    TileRenderResponseV3,
)
from app.services.tile_engine import (
    TILE_CATALOG,
    get_tile_by_id,
    generate_tile_texture,
    tile_detector,
    tile_renderer,
)

router = APIRouter()

# Backward-compatibility alias for legacy code
_active_surface_session_v3 = {
    "image_id": None,
    "surface_type": None,
    "raw_mask": None,
    "composite_mask_b64": None,
    "last_render_b64": None,
}

@router.get("/catalog", response_model=List[TileCatalogItemV3])
async def get_catalog():
    """Returns the full architectural tile catalog for V3.0."""
    return TILE_CATALOG

@router.post("/detect-surface", response_model=SurfaceDetectResponseV3)
async def detect_tile_surface(req: SurfaceDetectRequestV3):
    """V3.0: Open-vocabulary neural surface grounding with obstacle carving."""
    active_image = session_manager.get_active_image()
    if active_image is None:
        raise HTTPException(
            status_code=400,
            detail="No active image loaded. Please upload a room photograph first."
        )

    try:
        res = await asyncio.to_thread(
            tile_detector.detect_surface,
            surface_type=req.surface_type,
            confidence=req.confidence,
            custom_prompt=req.custom_prompt
        )

        session_manager.set_surface_mask(
            surface_type=res["surface_type"],
            raw_mask=res["raw_mask"],
            composite_mask_b64=res["composite_mask_base64"],
        )

        return SurfaceDetectResponseV3(
            success=True,
            message=f"Successfully segmented {res['num_regions']} {req.surface_type} region(s) in {res['execution_time_ms']}ms using SAM 3.",
            surface_type=res["surface_type"],
            num_regions=res["num_regions"],
            surface_masks=res["surface_masks"],
            composite_mask_base64=res["composite_mask_base64"],
            execution_time_ms=res["execution_time_ms"],
        )
    except Exception as e:
        api_logger.error(f"[V3 API] Surface detection error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Surface detection failed: {str(e)}")

@router.post("/render-tile", response_model=TileRenderResponseV3)
async def render_tile_visualizer(req: TileRenderRequestV3):
    """V3.0: High-Fidelity PBR & Neural Perspective Tile Projection Engine."""
    active_image = session_manager.get_active_image()
    if active_image is None:
        raise HTTPException(
            status_code=400,
            detail="No active image loaded. Please upload a room photograph first."
        )

    _, mask, comp_b64 = session_manager.get_surface_mask()

    if mask is None:
        raise HTTPException(
            status_code=400,
            detail=f"No detected {req.surface_type} surface found for this image. Please click '⚡ Detect Surface (SAM 3)' first."
        )

    try:
        render_res = await asyncio.to_thread(
            tile_renderer.render_tiled_surface,
            original_img=active_image,
            mask=mask,
            tile_id=req.tile_id,
            surface_type=req.surface_type,
            scale=req.scale,
            rotation_deg=req.rotation_deg,
            perspective_strength=req.perspective_strength,
            shadow_retention=req.shadow_retention,
            grout_width=req.grout_width,
            grout_color=req.grout_color,
            glossiness=req.glossiness,
            blending_mode=req.blending_mode,
            auto_vanishing_point=req.auto_vanishing_point,
            pbr_bump_strength=req.pbr_bump_strength,
            fresnel_reflection_strength=req.fresnel_reflection_strength,
            grout_crevice_depth=req.grout_crevice_depth,
        )

        session_manager.set_last_render(render_res["rendered_image_base64"])

        tile_meta = get_tile_by_id(req.tile_id)
        tile_name = tile_meta["name"] if tile_meta else req.tile_id

        return TileRenderResponseV3(
            success=True,
            message=f"Successfully rendered '{tile_name}' on {req.surface_type} using V3.0 {req.blending_mode.upper()} engine.",
            tile_id=req.tile_id,
            surface_type=req.surface_type,
            blending_mode=req.blending_mode,
            rendered_image_base64=render_res["rendered_image_base64"],
            mask_overlay_base64=comp_b64 or "",
            execution_time_ms=render_res["execution_time_ms"],
            auto_vanishing_point=render_res["auto_vanishing_point"],
            vanishing_point=render_res["vanishing_point"],
        )
    except Exception as e:
        api_logger.error(f"[V3 API] Tile rendering error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"V3 Tile rendering failed: {str(e)}")

@router.get("/texture/{tile_id}")
async def get_raw_tile_texture(tile_id: str):
    """Streams the raw 512x512 tile texture PNG."""
    tex_img = generate_tile_texture(tile_id, size=512)
    buf = io.BytesIO()
    tex_img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")


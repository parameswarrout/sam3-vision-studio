import io
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Response

from app.core import sam3_service, api_logger, session_manager
from app.config import settings
from app.schemas.v2_5_tile import (
    TileCatalogItem,
    SurfaceDetectRequest,
    SurfaceDetectResponse,
    SurfaceMaskInfo,
    TileRenderRequest,
    TileRenderResponse,
)
from app.services.tile_engine import (
    TILE_CATALOG,
    get_tile_by_id,
    generate_tile_texture,
    ensure_all_tile_textures,
    tile_detector,
    tile_renderer,
)

router = APIRouter()

# Backward-compatibility alias for legacy code
_active_surface_session = {
    "image_id": None,
    "surface_type": "floor",
    "raw_mask": None,
    "last_render_b64": None,
    "composite_mask_b64": None,
}

# Ensure texture assets are generated
tile_dirs = [
    Path(settings.BASE_DIR) / "data" / "tiles",
    Path(settings.BASE_DIR).parent / "frontend" / "public" / "tiles",
]
ensure_all_tile_textures(tile_dirs)

@router.get("/catalog", response_model=List[TileCatalogItem])
async def get_tile_catalog():
    """Returns list of all 15+ architectural tile textures with specs and materials."""
    items = []
    for t in TILE_CATALOG:
        items.append(TileCatalogItem(
            id=t["id"],
            name=t["name"],
            category=t["category"],
            material=t["material"],
            finish=t["finish"],
            color_tone=t["color_tone"],
            description=t["description"],
            default_scale=t.get("default_scale", 1.0),
            aspect_ratio=t.get("aspect_ratio", "square"),
            roughness=t.get("roughness", 0.5),
            specular=t.get("specular", 0.5),
            grout_default_color=t.get("grout_default_color", "#CBD5E1"),
            grout_default_width=t.get("grout_default_width", 2),
            accent_color=t.get("accent_color", "#6366F1"),
            tag=t.get("tag"),
            thumbnail_url=f"/tiles/{t['id']}.png"
        ))
    return items

@router.post("/detect-surface", response_model=SurfaceDetectResponse)
async def detect_room_surface(req: SurfaceDetectRequest):
    """Executes SAM 3 surface detection for Floor or Wall planes with obstacle carving."""
    active_image = session_manager.get_active_image()
    if active_image is None:
        raise HTTPException(
            status_code=400,
            detail="No active room photo found. Please select or upload a room image first."
        )

    try:
        api_logger.info(f"[V2.5 API] Detect Surface: type='{req.surface_type}', confidence={req.confidence:.2f}")
        det = await asyncio.to_thread(
            tile_detector.detect_surface,
            surface_type=req.surface_type,
            confidence=req.confidence,
            custom_prompt=req.custom_prompt,
        )

        session_manager.set_surface_mask(
            surface_type=req.surface_type,
            raw_mask=det["raw_mask"],
            composite_mask_b64=det["composite_mask_base64"],
        )

        surface_masks_schema = [
            SurfaceMaskInfo(
                surface_type=m["surface_type"],
                label=m["label"],
                area_ratio=m["area_ratio"],
                bbox=m["bbox"],
                mask_base64=m["mask_base64"],
                color=m["color"],
            ) for m in det["surface_masks"]
        ]

        return SurfaceDetectResponse(
            success=True,
            message=f"Successfully detected {len(surface_masks_schema)} {req.surface_type} surface region(s).",
            surface_type=req.surface_type,
            num_regions=len(surface_masks_schema),
            surface_masks=surface_masks_schema,
            composite_mask_base64=det["composite_mask_base64"],
            execution_time_ms=det["execution_time_ms"],
        )
    except Exception as e:
        api_logger.error(f"Surface detection error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Surface detection failed: {str(e)}")

@router.post("/render-tile", response_model=TileRenderResponse)
async def render_tile_visualizer(req: TileRenderRequest):
    """Renders selected tile pattern onto the detected surface with perspective and lighting blending."""
    active_image = session_manager.get_active_image()
    if active_image is None:
        raise HTTPException(
            status_code=400,
            detail="No active room image in session. Please upload a room photo first."
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

        return TileRenderResponse(
            success=True,
            message=f"Successfully rendered '{tile_name}' on {req.surface_type} using {req.blending_mode.upper()} engine.",
            tile_id=req.tile_id,
            surface_type=req.surface_type,
            blending_mode=req.blending_mode,
            rendered_image_base64=render_res["rendered_image_base64"],
            mask_overlay_base64=comp_b64 or "",
            execution_time_ms=render_res["execution_time_ms"],
        )
    except Exception as e:
        api_logger.error(f"Tile rendering error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Tile rendering failed: {str(e)}")

@router.get("/texture/{tile_id}")
async def get_raw_tile_texture(tile_id: str):
    """Streams the raw 512x512 tile texture PNG."""
    tex_img = generate_tile_texture(tile_id, size=512)
    buf = io.BytesIO()
    tex_img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")


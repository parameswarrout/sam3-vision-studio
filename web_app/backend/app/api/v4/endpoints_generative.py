import asyncio
from typing import List
from fastapi import APIRouter, HTTPException

from app.core import api_logger, session_manager
from app.schemas.v4_generative import (
    StylePresetInfo,
    GenerativeRestyleRequest,
    GenerativeRestyleResponse,
    GenerativeStatusResponse,
)
from app.services.generative import STYLE_PRESETS, cpu_diffusion_engine

router = APIRouter()

@router.get("/presets", response_model=List[StylePresetInfo])
async def get_style_presets():
    """Returns curated interior architectural style presets."""
    return STYLE_PRESETS

@router.get("/status", response_model=GenerativeStatusResponse)
async def get_generative_status():
    """Returns current diffusion engine status."""
    return GenerativeStatusResponse(
        ready=cpu_diffusion_engine.pipe is not None,
        model_name=cpu_diffusion_engine.model_id,
        device=cpu_diffusion_engine.device,
        num_threads=8,
        styles_count=len(STYLE_PRESETS),
    )

@router.post("/restyle-room", response_model=GenerativeRestyleResponse)
async def restyle_room(req: GenerativeRestyleRequest):
    """
    V4.0: Executes Generative Latent Diffusion Inpainting
    guided by SAM 3 architectural masks and prompt architecture.
    """
    active_image = session_manager.get_active_image()
    if active_image is None:
        raise HTTPException(
            status_code=400,
            detail="No active image loaded. Please upload a room photograph first."
        )

    try:
        # Access active SAM 3 segmentation mask from thread-safe session manager
        _, raw_mask, _ = session_manager.get_surface_mask()

        res = await asyncio.to_thread(
            cpu_diffusion_engine.restyle_room,
            original_img=active_image,
            mask=raw_mask if req.mask_mode == "surface_only" else None,
            style_preset_id=req.style_preset,
            custom_prompt=req.custom_prompt,
            negative_prompt=req.negative_prompt,
            strength=req.strength,
            guidance_scale=req.guidance_scale,
            num_inference_steps=req.num_inference_steps,
            seed=req.seed,
            mask_mode=req.mask_mode,
        )

        return GenerativeRestyleResponse(
            success=True,
            message=f"Successfully generated photorealistic room restyle in {res['execution_time_ms']/1000:.1f}s on {res.get('device', 'CPU').upper()}.",
            style_preset=res["style_preset"],
            prompt_used=res["prompt_used"],
            negative_prompt_used=res["negative_prompt_used"],
            generated_image_base64=res["generated_image_base64"],
            execution_time_ms=res["execution_time_ms"],
            seed_used=res["seed_used"],
            steps_executed=res["steps_executed"],
        )
    except Exception as e:
        api_logger.error(f"[V4 API] Generative restyle error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Generative room restyle failed: {str(e)}")


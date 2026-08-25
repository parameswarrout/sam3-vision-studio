from fastapi import APIRouter, HTTPException
from app.core import sam3_service, MaskEngine, api_logger
from app.schemas import TextPromptRequest, SegmentationResponse

router = APIRouter()

@router.post("/segment-text", response_model=SegmentationResponse)
async def segment_by_text(req: TextPromptRequest):
    """Segments objects using an open-vocabulary text query with confidence threshold."""
    if not sam3_service.current_image:
        api_logger.warning("Text segmentation rejected: No active image uploaded.")
        raise HTTPException(status_code=400, detail="No active image uploaded. Please upload an image first.")

    try:
        api_logger.info(f"API Text Prompt Request: prompt='{req.prompt}', confidence={req.confidence:.2f}")
        res = sam3_service.segment_text(prompt=req.prompt, confidence=req.confidence)
        masks = res.get("masks", None)
        boxes = res.get("boxes", None)
        num_found = len(masks) if masks is not None else 0

        if num_found == 0:
            api_logger.info(f"Zero objects detected for '{req.prompt}'.")
            return SegmentationResponse(
                success=True,
                message=f"No instances found matching '{req.prompt}' (confidence >= {req.confidence:.2f}). Try lowering the confidence slider!",
                num_objects=0,
                image_base64=MaskEngine.pil_to_base64(sam3_service.current_image),
                boxes=[],
                labels=[],
                execution_time_ms=res["execution_time_ms"],
            )

        labels = [req.prompt] * num_found
        overlay_img = MaskEngine.render_overlay(
            image=sam3_service.current_image,
            masks=masks,
            boxes=boxes,
            labels=labels,
        )

        api_logger.info(f"Successfully generated overlay with {num_found} mask(s) for '{req.prompt}'.")
        return SegmentationResponse(
            success=True,
            message=f"Successfully segmented {num_found} object(s) matching '{req.prompt}'.",
            num_objects=num_found,
            image_base64=MaskEngine.pil_to_base64(overlay_img),
            boxes=boxes,
            labels=labels,
            execution_time_ms=res["execution_time_ms"],
        )
    except Exception as e:
        api_logger.error(f"Text segmentation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Text segmentation failed: {str(e)}")

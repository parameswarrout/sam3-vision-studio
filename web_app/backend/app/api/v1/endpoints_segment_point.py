from fastapi import APIRouter, HTTPException
from app.core import sam3_service, MaskEngine, api_logger
from app.schemas import PointPromptRequest, SegmentationResponse

router = APIRouter()

@router.post("/segment-points", response_model=SegmentationResponse)
async def segment_by_points(req: PointPromptRequest):
    """Segments objects based on interactive positive and negative click coordinates."""
    if not sam3_service.current_image:
        api_logger.warning("Point segmentation rejected: No active image uploaded.")
        raise HTTPException(status_code=400, detail="No active image uploaded. Please upload an image first.")

    if not req.points:
        api_logger.info("Empty points payload received; returning clean base image.")
        return SegmentationResponse(
            success=True,
            message="No points provided. Returning original base image.",
            num_objects=0,
            image_base64=MaskEngine.pil_to_base64(sam3_service.current_image),
            boxes=[],
            labels=[],
            execution_time_ms=0.0,
        )

    try:
        points_list = [[p.x, p.y] for p in req.points]
        labels_list = [p.label for p in req.points]

        api_logger.info(f"API Point Prompt Request: {len(points_list)} point(s)")
        res = sam3_service.segment_points(points=points_list, labels=labels_list)
        masks = res.get("masks", None)
        boxes = res.get("boxes", None)
        num_found = len(masks) if masks is not None else 0

        if num_found == 0:
            api_logger.info("Zero mask regions found for point prompts.")
            return SegmentationResponse(
                success=True,
                message="No mask regions generated for given points.",
                num_objects=0,
                image_base64=MaskEngine.pil_to_base64(sam3_service.current_image),
                boxes=[],
                labels=[],
                execution_time_ms=res["execution_time_ms"],
            )

        labels = ["Object Region"] * num_found
        overlay_img = MaskEngine.render_overlay(
            image=sam3_service.current_image,
            masks=masks,
            boxes=boxes,
            labels=labels,
        )

        cutout_b64, cropped_b64, mask_b64, regions = MaskEngine.generate_cutouts(
            image=sam3_service.current_image,
            masks=masks,
            boxes=boxes,
            labels=labels,
        )

        api_logger.info(f"Successfully generated overlay and cutouts with {num_found} mask(s) for point prompt.")
        return SegmentationResponse(
            success=True,
            message=f"Interactive segmentation updated ({num_found} mask regions).",
            num_objects=num_found,
            image_base64=MaskEngine.pil_to_base64(overlay_img),
            cutout_image_base64=cutout_b64,
            cropped_cutout_base64=cropped_b64,
            mask_only_base64=mask_b64,
            regions=regions,
            boxes=boxes,
            labels=labels,
            execution_time_ms=res["execution_time_ms"],
        )
    except Exception as e:
        api_logger.error(f"Point segmentation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Point segmentation failed: {str(e)}")

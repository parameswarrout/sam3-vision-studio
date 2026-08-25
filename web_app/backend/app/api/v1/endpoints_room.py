import io
import asyncio
import torch
from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image, ImageOps

from app.core.logger import api_logger
from app.schemas.room import RoomAnalysisResponse
from app.v2_room_analysis import room_analyzer

router = APIRouter()

@router.post("/analyze-room", response_model=RoomAnalysisResponse)
async def analyze_room(file: UploadFile = File(...)):
    """
    SAM 3 V2 Automatic Room Analysis.
    Accepts an interior room photo and returns structured masks for Walls, Floor,
    Ceiling, Openings (Windows & Doors), and Occluding Furniture.
    """
    if not file.content_type.startswith("image/"):
        api_logger.warning(f"Room analysis rejected invalid content-type: {file.content_type}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Please upload an image (JPEG, PNG, WebP)."
        )

    try:
        api_logger.info(f"Received Room Analysis request: filename='{file.filename}', size_bytes={file.size or 'stream'}")
        image_bytes = await file.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        try:
            raw_image = Image.open(io.BytesIO(image_bytes))
            # Safe EXIF orientation normalization for mobile phone photos
            image = ImageOps.exif_transpose(raw_image).convert("RGB")
        except Exception as img_err:
            api_logger.error(f"Failed to decode image: {img_err}")
            raise HTTPException(status_code=400, detail="Corrupted or unreadable image file.")

        # Non-blocking execution in threadpool to keep server event loop responsive
        result = await asyncio.to_thread(room_analyzer.analyze, image)
        return result

    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Unexpected error during room analysis: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Room analysis engine failed: {str(e)}"
        )
    finally:
        # Free unused PyTorch cache to keep GPU VRAM footprint minimal
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

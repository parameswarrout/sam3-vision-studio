import io
import asyncio
import base64
import hashlib
import torch
from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image, ImageOps

from app.core import sam3_service
from app.core.logger import api_logger
from app.schemas.room import RoomAnalysisResponse
from app.v2_room_analysis import room_analyzer
from app.storage import storage_service, TensorSerializer
from app.db import AsyncSessionLocal, RoomRepository

router = APIRouter()

def create_thumbnail_base64(image: Image.Image, size=(180, 120)) -> str:
    """Generates a compressed, lightweight JPEG thumbnail data URI."""
    thumb = image.copy()
    thumb.thumbnail(size, Image.Resampling.LANCZOS)
    buffer = io.BytesIO()
    thumb.save(buffer, format="JPEG", quality=75)
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"

@router.post("/analyze-room", response_model=RoomAnalysisResponse)
async def analyze_room(file: UploadFile = File(...)):
    """
    SAM 3 V2 Automatic Room Analysis.
    Accepts an interior room photo and returns structured masks for Walls, Floor,
    Ceiling, Openings (Windows & Doors), and Occluding Furniture.
    Automatically persists metadata to SQLite and compressed GPU tensors to storage.
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

        # 1. Non-blocking execution in threadpool to keep server event loop responsive
        result = await asyncio.to_thread(room_analyzer.analyze, image)

        # 2. Asynchronous persistence to storage & database in background
        async def persist_session():
            try:
                # Safe image hash extraction from metadata or raw bytes
                img_hash = (
                    getattr(result.metadata, "image_hash", None)
                    or getattr(result, "image_hash", None)
                    or hashlib.sha256(image_bytes).hexdigest()[:16]
                )

                # Save full image to storage
                img_path = f"images/{img_hash}.jpg"
                storage_service.save_bytes(img_path, image_bytes)

                # Pack and save GPU tensors
                tensor_path = f"tensors/{img_hash}.npz"
                tensor_bytes = TensorSerializer.pack_tensors()
                saved_tensor_uri = storage_service.save_bytes(tensor_path, tensor_bytes)

                # Generate thumbnail
                thumb_b64 = create_thumbnail_base64(image)

                # Calculate confidence and dimensions safely
                avg_confidence = float(
                    sum(r.confidence for r in result.regions) / max(len(result.regions), 1)
                ) if result.regions else 0.90

                quality_scores = {
                    "semantic": 0.90,
                    "geometry": 0.90,
                    "boundary": 0.90,
                }

                # Persist to database
                async with AsyncSessionLocal() as db_session:
                    await RoomRepository.save_room_analysis(
                        session=db_session,
                        image_hash=img_hash,
                        room_title=file.filename or "Interior Room Analysis",
                        image_storage_path=img_path,
                        thumbnail_base64=thumb_b64,
                        img_width=getattr(result, "width", None) or image.width,
                        img_height=getattr(result, "height", None) or image.height,
                        regions=[r.model_dump() for r in result.regions],
                        quality_scores=quality_scores,
                        overall_confidence=avg_confidence,
                        execution_time_ms=getattr(result, "execution_time_ms", 0.0),
                        tensor_uri=saved_tensor_uri,
                        tensor_size_bytes=len(tensor_bytes),
                        compute_device=sam3_service.device,
                    )
                api_logger.info(f"[SessionPersist] Successfully auto-persisted room session: {img_hash}")
            except Exception as persist_err:
                api_logger.error(f"[SessionPersist] Failed to auto-persist room session: {persist_err}", exc_info=True)

        # Launch persistence without delaying user response
        asyncio.create_task(persist_session())

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

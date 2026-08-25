import io
from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image

from app.core import sam3_service, MaskEngine, api_logger

router = APIRouter()

@router.post("/set-image")
async def upload_and_set_image(file: UploadFile = File(...)):
    """Uploads an image, caches it, and computes SAM 3 visual feature embeddings."""
    if not file.content_type.startswith("image/"):
        api_logger.warning(f"Rejected invalid file type upload: {file.content_type}")
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

    try:
        api_logger.info(f"Receiving image upload: filename='{file.filename}', content_type='{file.content_type}'")
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        info = sam3_service.set_image(image)
        base64_img = MaskEngine.pil_to_base64(image)
        
        api_logger.info(f"Image successfully cached and embedded ({info['width']}x{info['height']}px)")
        return {
            "success": True,
            "message": "Image successfully uploaded and embedded.",
            "width": info["width"],
            "height": info["height"],
            "image_base64": base64_img,
        }
    except Exception as e:
        api_logger.error(f"Image processing failure: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")

@router.post("/reset")
async def reset_session():
    """Clears current active image session."""
    api_logger.info("Session reset requested via API.")
    sam3_service.reset_session()
    return {"success": True, "message": "Session reset successfully."}

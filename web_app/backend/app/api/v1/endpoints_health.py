from fastapi import APIRouter, HTTPException
import torch
from app.config import settings
from app.core import sam3_service, api_logger
from app.schemas import HealthResponse
from app.schemas.requests import DeviceSwitchRequest, DeviceSwitchResponse

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def get_health():
    """Returns the health, execution device, and status of the SAM 3 backend."""
    return HealthResponse(
        status="healthy",
        model_loaded=sam3_service.is_loaded,
        checkpoint_path=sam3_service.checkpoint_path,
        device=sam3_service.device,
        cuda_available=torch.cuda.is_available(),
        version=settings.VERSION,
    )

@router.post("/device/switch", response_model=DeviceSwitchResponse)
async def switch_device(req: DeviceSwitchRequest):
    """Dynamically reloads SAM 3 onto CUDA GPU or CPU."""
    target_device = req.device.lower().strip()
    
    if target_device not in ["cuda", "cpu"]:
        api_logger.warning(f"Rejected invalid device switch request: '{target_device}'")
        raise HTTPException(status_code=400, detail="Invalid device choice. Must be 'cuda' or 'cpu'.")

    if target_device == "cuda" and not torch.cuda.is_available():
        api_logger.warning("Rejected CUDA switch request: CUDA is not available on this host.")
        raise HTTPException(
            status_code=400,
            detail="NVIDIA CUDA GPU is not available on this system. Please use CPU Mode."
        )

    try:
        api_logger.info(f"Initiating dynamic device reload to: {target_device.upper()}")
        res = sam3_service.load_model(
            checkpoint_path=req.checkpoint_path,
            force_device=target_device,
        )
        api_logger.info(f"Device reload complete: {target_device.upper()} in {res['load_time_s']}s")
        return DeviceSwitchResponse(
            success=True,
            message=f"SAM 3 successfully loaded onto {target_device.upper()} in {res['load_time_s']}s.",
            device=res["device"],
            load_time_s=res["load_time_s"],
            cuda_available=torch.cuda.is_available(),
        )
    except Exception as e:
        api_logger.error(f"Device switch error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to switch device: {str(e)}")

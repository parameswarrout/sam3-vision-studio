from fastapi import APIRouter
from app.api.v4.endpoints_generative import router as v4_generative_router

router_v4 = APIRouter()
router_v4.include_router(v4_generative_router)

__all__ = ["router_v4"]

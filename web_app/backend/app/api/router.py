from fastapi import APIRouter
from app.config import settings

from app.api.v1 import router_v1
from app.api.v2 import router_v2
from app.api.v2_5 import router_v2_5
from app.api.v3 import router_v3
from app.api.v4 import router_v4
from app.api.v5 import router_v5

# Master aggregated router mounted at settings.API_V1_PREFIX ("/api/v1")
api_router = APIRouter()

api_v1_aggregator = APIRouter()
api_v1_aggregator.include_router(router_v1)
api_v1_aggregator.include_router(router_v2)
api_v1_aggregator.include_router(router_v2_5, prefix="/v2.5/tiles", tags=["Room Tile Visualizer (V2.5)"])
api_v1_aggregator.include_router(router_v3, prefix="/v3/tiles", tags=["Room Tile Visualizer (V3.0 PBR & Neural Perspective)"])
api_v1_aggregator.include_router(router_v4, prefix="/v4/generate", tags=["AI Generative Diffusion Studio (V4.0)"])
api_v1_aggregator.include_router(router_v5, prefix="/v5/surface-replacement", tags=["Physically-Based Room Surface Replacement Engine (V5)"])

api_router.include_router(api_v1_aggregator, prefix=settings.API_V1_PREFIX)

__all__ = ["api_router"]


from fastapi import APIRouter
from app.api.v2_5.endpoints_tiles import router as v2_5_tile_router

router_v2_5 = APIRouter()
router_v2_5.include_router(v2_5_tile_router)

__all__ = ["router_v2_5"]

from fastapi import APIRouter
from app.api.v3.endpoints_tiles import router as v3_tile_router

router_v3 = APIRouter()
router_v3.include_router(v3_tile_router)

__all__ = ["router_v3"]

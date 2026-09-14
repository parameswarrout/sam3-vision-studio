from fastapi import APIRouter
from app.api.v2.endpoints_room import router as room_router
from app.api.v2.endpoints_history import router as history_router

router_v2 = APIRouter()
router_v2.include_router(room_router, tags=["Automatic Room Analysis (V2)"])
router_v2.include_router(history_router, prefix="/rooms", tags=["Saved History & Database (V2)"])

__all__ = ["router_v2"]

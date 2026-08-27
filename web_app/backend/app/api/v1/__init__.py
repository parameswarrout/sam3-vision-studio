from fastapi import APIRouter
from app.api.v1.endpoints_health import router as health_router
from app.api.v1.endpoints_image import router as image_router
from app.api.v1.endpoints_segment_text import router as segment_text_router
from app.api.v1.endpoints_segment_point import router as segment_point_router
from app.api.v1.endpoints_room import router as room_router
from app.api.v1.endpoints_history import router as history_router
from app.api.v1.endpoints_auth import router as auth_router
from app.api.v1.endpoints_admin import router as admin_router
from app.v2_5_tile_visualizer import v2_5_tile_router
from app.v3_tile_visualizer import v3_tile_router

api_v1_router = APIRouter()

api_v1_router.include_router(health_router, tags=["Health"])
api_v1_router.include_router(auth_router, prefix="/auth", tags=["User Authentication & Multi-Tenancy"])
api_v1_router.include_router(admin_router, prefix="/admin", tags=["Admin Dashboard & Audit Logs"])
api_v1_router.include_router(image_router, tags=["Image & Session"])
api_v1_router.include_router(segment_text_router, tags=["Text Prompt Segmentation"])
api_v1_router.include_router(segment_point_router, tags=["Point Prompt Segmentation"])
api_v1_router.include_router(room_router, tags=["Automatic Room Analysis (V2)"])
api_v1_router.include_router(history_router, prefix="/rooms", tags=["Saved History & Database (V2)"])
api_v1_router.include_router(v2_5_tile_router, prefix="/v2.5/tiles", tags=["Room Tile Visualizer (V2.5)"])
api_v1_router.include_router(v3_tile_router, prefix="/v3/tiles", tags=["Room Tile Visualizer (V3.0 PBR & Neural Perspective)"])

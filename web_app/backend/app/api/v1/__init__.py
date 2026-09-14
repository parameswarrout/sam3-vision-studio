from fastapi import APIRouter
from app.api.v1.endpoints_health import router as health_router
from app.api.v1.endpoints_image import router as image_router
from app.api.v1.endpoints_segment_text import router as segment_text_router
from app.api.v1.endpoints_segment_point import router as segment_point_router
from app.api.v1.endpoints_auth import router as auth_router
from app.api.v1.endpoints_admin import router as admin_router

router_v1 = APIRouter()

router_v1.include_router(health_router, tags=["Health & Hardware"])
router_v1.include_router(auth_router, prefix="/auth", tags=["User Authentication & Multi-Tenancy"])
router_v1.include_router(admin_router, prefix="/admin", tags=["Admin Dashboard & Audit Logs"])
router_v1.include_router(image_router, tags=["Image & Session"])
router_v1.include_router(segment_text_router, tags=["Text Prompt Segmentation"])
router_v1.include_router(segment_point_router, tags=["Point Prompt Segmentation"])

# Backward compatibility alias
api_v1_router = router_v1

__all__ = ["router_v1", "api_v1_router"]


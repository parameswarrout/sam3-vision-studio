from fastapi import APIRouter
from app.config import settings
from app.api.v1 import api_v1_router

api_router = APIRouter()
api_router.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

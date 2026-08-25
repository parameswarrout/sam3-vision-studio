import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.core import sam3_service, logger
from app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager: Automatically preloads the SAM 3 model into memory."""
    logger.info(f"Initializing {settings.PROJECT_NAME} v{settings.VERSION}")
    try:
        if os.path.exists(settings.DEFAULT_CHECKPOINT):
            sam3_service.ensure_model()
        else:
            logger.warning(f"Checkpoint not found at {settings.DEFAULT_CHECKPOINT}. Model will load on demand.")
    except Exception as e:
        logger.error(f"Error during model preload: {e}")
    yield
    logger.info("Shutting down SAM 3 Modular Vision API...")

def create_application() -> FastAPI:
    """FastAPI Application Factory."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
        docs_url=f"{settings.API_V1_PREFIX}/docs",
        redoc_url=f"{settings.API_V1_PREFIX}/redoc",
        lifespan=lifespan,
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Attach routers
    app.include_router(api_router)

    # Root welcome route
    @app.get("/")
    async def root():
        return {
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "docs": f"{settings.API_V1_PREFIX}/docs",
            "device": sam3_service.device,
            "status": "online"
        }

    return app

app = create_application()

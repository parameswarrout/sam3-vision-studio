import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.core import sam3_service, logger
from app.core.exceptions import AppException
from app.api.router import api_router
from app.db import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager: Automatically initializes database and preloads the SAM 3 model."""
    logger.info(f"Initializing {settings.PROJECT_NAME} v{settings.VERSION}")
    try:
        await init_db()
    except Exception as db_err:
        logger.error(f"Database initialization error: {db_err}")

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

    # Process Timing Middleware
    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.4f}s"
        return response

    # Global Custom Application Exception Handler
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        logger.warning(f"AppException [{exc.error_code}]: {exc.message} (path={request.url.path})")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": exc.error_code,
                    "message": exc.message,
                    "details": exc.details,
                }
            }
        )

    # Global Unhandled Exception Handler
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled Server Error at {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected internal server error occurred.",
                    "details": str(exc) if settings.DEBUG else {},
                }
            }
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


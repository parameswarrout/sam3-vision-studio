import os
from pathlib import Path
from typing import List
from pydantic import BaseModel, ConfigDict

# Base directory for the entire repository
BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent
BACKEND_DIR: Path = Path(__file__).resolve().parent.parent

class Settings(BaseModel):
    # Application Info
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "SAM 3 Modular Vision API")
    VERSION: str = os.getenv("VERSION", "1.0.0")
    API_V1_PREFIX: str = os.getenv("API_V1_PREFIX", "/api/v1")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")

    # Directory Paths
    BASE_DIR: Path = BASE_DIR
    BACKEND_DIR: Path = BACKEND_DIR
    DATA_DIR: Path = BACKEND_DIR / "data"
    STORAGE_DIR: Path = BACKEND_DIR / "data" / "storage"
    TILES_DIR: Path = BACKEND_DIR / "data" / "tiles"
    MODELS_DIR: Path = BACKEND_DIR / "data" / "models"
    
    # Model Checkpoints
    DEFAULT_CHECKPOINT: str = os.getenv(
        "SAM3_CHECKPOINT", 
        str(BASE_DIR / "sam3" / "checkpoints" / "sam3.pt")
    )
    DIFFUSION_MODEL_PATH: str = os.getenv(
        "DIFFUSION_MODEL_PATH",
        str(BACKEND_DIR / "data" / "models" / "diffusion_inpaint")
    )
    
    # Execution & Hardware
    DEFAULT_DEVICE: str = os.getenv("DEFAULT_DEVICE", "cuda")
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))
    NUM_WORKERS: int = int(os.getenv("NUM_WORKERS", "1"))
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{BACKEND_DIR / 'data' / 'rooms.db'}")
    
    # Security & JWT
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "sam3-vision-studio-super-secure-production-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Cache & Session Limits
    MAX_CACHED_SESSIONS: int = int(os.getenv("MAX_CACHED_SESSIONS", "100"))
    SESSION_TTL_SECONDS: int = int(os.getenv("SESSION_TTL_SECONDS", "3600"))

    model_config = ConfigDict(arbitrary_types_allowed=True)

settings = Settings()

# Ensure critical data directories exist on startup
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.TILES_DIR.mkdir(parents=True, exist_ok=True)
(settings.STORAGE_DIR / "images").mkdir(parents=True, exist_ok=True)
(settings.STORAGE_DIR / "tensors").mkdir(parents=True, exist_ok=True)


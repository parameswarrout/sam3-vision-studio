import os
from pathlib import Path
from pydantic import BaseModel

class Settings:
    PROJECT_NAME: str = "SAM 3 Modular Vision API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Checkpoint path discovery
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent
    DEFAULT_CHECKPOINT: str = str(BASE_DIR / "sam3" / "checkpoints" / "sam3.pt")
    
    # Execution
    DEFAULT_DEVICE: str = "cuda"  # Auto fallback to cpu if cuda not available
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

settings = Settings()

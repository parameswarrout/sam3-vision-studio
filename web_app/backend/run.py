import sys
import os
from pathlib import Path

# Force UTF-8 on Windows standard outputs if possible
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

backend_dir = Path(__file__).resolve().parent
root_dir = backend_dir.parent.parent
sam3_dir = root_dir / "sam3"

# Ensure backend directory has top priority on sys.path
if str(backend_dir) in sys.path:
    sys.path.remove(str(backend_dir))
sys.path.insert(0, str(backend_dir))

# Append sam3 directory at the end for model loading if needed
if str(sam3_dir) not in sys.path:
    sys.path.append(str(sam3_dir))

import uvicorn
from app.config import settings
from app.core.logger import logger
from app.main import app

def main():
    logger.info("=" * 60)
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Server Endpoint: http://{settings.HOST}:{settings.PORT}")
    logger.info(f"API Documentation: http://{settings.HOST}:{settings.PORT}/api/v1/docs")
    logger.info("=" * 60)
    
    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
        log_level="info",
    )

if __name__ == "__main__":
    main()

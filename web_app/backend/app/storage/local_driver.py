import os
from pathlib import Path
from typing import Optional
from app.storage.base import StorageDriver
from app.core.logger import api_logger

class LocalStorageDriver(StorageDriver):
    """
    Local filesystem storage driver storing artifacts under `data/storage/`.
    """

    def __init__(self, base_dir: Optional[str] = None):
        if base_dir is None:
            # Default to backend/data/storage
            backend_dir = Path(__file__).resolve().parent.parent.parent
            self.base_dir = backend_dir / "data" / "storage"
        else:
            self.base_dir = Path(base_dir)

        # Ensure subdirectories exist
        (self.base_dir / "images").mkdir(parents=True, exist_ok=True)
        (self.base_dir / "tensors").mkdir(parents=True, exist_ok=True)
        api_logger.info(f"[LocalStorageDriver] Initialized storage at {self.base_dir}")

    def _resolve(self, relative_path: str) -> Path:
        clean_path = relative_path.lstrip("/\\")
        return self.base_dir / clean_path

    def save_bytes(self, relative_path: str, data: bytes) -> str:
        target = self._resolve(relative_path)
        target.parent.mkdir(parents=True, exist_ok=True)
        with open(target, "wb") as f:
            f.write(data)
        return str(target.relative_to(self.base_dir)).replace("\\", "/")

    def load_bytes(self, relative_path: str) -> Optional[bytes]:
        target = self._resolve(relative_path)
        if not target.exists():
            return None
        with open(target, "rb") as f:
            return f.read()

    def delete(self, relative_path: str) -> bool:
        target = self._resolve(relative_path)
        if target.exists():
            try:
                target.unlink()
                return True
            except Exception as e:
                api_logger.error(f"[LocalStorageDriver] Failed to delete {target}: {e}")
                return False
        return False

    def exists(self, relative_path: str) -> bool:
        return self._resolve(relative_path).exists()

    def get_absolute_path(self, relative_path: str) -> str:
        return str(self._resolve(relative_path))

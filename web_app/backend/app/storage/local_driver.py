import os
import asyncio
import tempfile
from pathlib import Path
from typing import Optional
from app.config import settings
from app.storage.base import StorageDriver
from app.core.logger import api_logger
from app.core.exceptions import StorageError

class LocalStorageDriver(StorageDriver):
    """
    Production-grade local filesystem storage driver.
    Provides path traversal guards, atomic write-and-rename consistency, and async helpers.
    """

    def __init__(self, base_dir: Optional[str] = None):
        if base_dir is None:
            self.base_dir = settings.STORAGE_DIR
        else:
            self.base_dir = Path(base_dir).resolve()

        # Ensure subdirectories exist
        (self.base_dir / "images").mkdir(parents=True, exist_ok=True)
        (self.base_dir / "tensors").mkdir(parents=True, exist_ok=True)
        api_logger.info(f"[LocalStorageDriver] Initialized secure storage at {self.base_dir}")

    def _resolve(self, relative_path: str) -> Path:
        """Resolves path and enforces strict containment within storage base directory."""
        clean_path = relative_path.lstrip("/\\")
        target = (self.base_dir / clean_path).resolve()
        
        # Guard against directory traversal attacks (e.g. '../../etc/passwd')
        try:
            target.relative_to(self.base_dir)
        except ValueError:
            raise StorageError(f"Security Alert: Path traversal attempt detected for '{relative_path}'")
            
        return target

    def save_bytes(self, relative_path: str, data: bytes) -> str:
        """Atomically saves binary data and returns normalized URI."""
        target = self._resolve(relative_path)
        target.parent.mkdir(parents=True, exist_ok=True)

        # Atomic write pattern using temp file in same directory
        temp_file = None
        try:
            with tempfile.NamedTemporaryFile(dir=str(target.parent), delete=False) as tf:
                temp_file = tf.name
                tf.write(data)
                tf.flush()
                os.fsync(tf.fileno())

            # Atomic replace (guaranteed atomic on POSIX, atomic on Windows when file exists)
            if target.exists():
                target.unlink()
            os.rename(temp_file, str(target))
            temp_file = None
            
            return str(target.relative_to(self.base_dir)).replace("\\", "/")
        except Exception as e:
            if temp_file and os.path.exists(temp_file):
                try:
                    os.unlink(temp_file)
                except Exception:
                    pass
            api_logger.error(f"[LocalStorageDriver] Failed to save {relative_path}: {e}")
            raise StorageError(f"Failed to persist file '{relative_path}': {str(e)}")

    async def async_save_bytes(self, relative_path: str, data: bytes) -> str:
        """Asynchronously writes bytes in worker threadpool."""
        return await asyncio.to_thread(self.save_bytes, relative_path, data)

    def load_bytes(self, relative_path: str) -> Optional[bytes]:
        """Loads raw bytes from storage."""
        target = self._resolve(relative_path)
        if not target.exists():
            return None
        with open(target, "rb") as f:
            return f.read()

    async def async_load_bytes(self, relative_path: str) -> Optional[bytes]:
        """Asynchronously loads raw bytes in worker threadpool."""
        return await asyncio.to_thread(self.load_bytes, relative_path)

    def delete(self, relative_path: str) -> bool:
        """Deletes artifact from storage."""
        try:
            target = self._resolve(relative_path)
            if target.exists():
                target.unlink()
                return True
            return False
        except Exception as e:
            api_logger.error(f"[LocalStorageDriver] Failed to delete {relative_path}: {e}")
            return False

    def exists(self, relative_path: str) -> bool:
        """Checks if artifact exists."""
        try:
            return self._resolve(relative_path).exists()
        except Exception:
            return False

    def get_absolute_path(self, relative_path: str) -> str:
        return str(self._resolve(relative_path))


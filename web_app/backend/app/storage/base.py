from abc import ABC, abstractmethod
from typing import Optional, BinaryIO

class StorageDriver(ABC):
    """
    Abstract Storage Driver for handling heavy binary artifacts (images, GPU tensors).
    Supports local filesystem today, drop-in AWS S3 / Cloudflare R2 / GCP Bucket tomorrow.
    """

    @abstractmethod
    def save_bytes(self, relative_path: str, data: bytes) -> str:
        """Saves binary data and returns the stored URI/path."""
        pass

    @abstractmethod
    def load_bytes(self, relative_path: str) -> Optional[bytes]:
        """Loads and returns raw bytes from the stored URI/path."""
        pass

    @abstractmethod
    def delete(self, relative_path: str) -> bool:
        """Deletes the artifact from storage."""
        pass

    @abstractmethod
    def exists(self, relative_path: str) -> bool:
        """Checks if the artifact exists in storage."""
        pass

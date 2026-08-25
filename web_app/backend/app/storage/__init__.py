from app.storage.base import StorageDriver
from app.storage.local_driver import LocalStorageDriver
from app.storage.tensor_serializer import TensorSerializer

# Global storage instance (defaults to local storage driver)
storage_service = LocalStorageDriver()

__all__ = ["StorageDriver", "LocalStorageDriver", "TensorSerializer", "storage_service"]

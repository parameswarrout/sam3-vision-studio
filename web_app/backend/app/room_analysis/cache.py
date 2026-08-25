import hashlib
import io
from typing import Dict, Optional, Any
from PIL import Image

from app.core.logger import api_logger

class RoomAnalysisCache:
    """
    LRU In-memory Cache for Room Analysis results keyed by SHA-256 image hash.
    Avoids duplicate GPU inference when the same room image is analyzed.
    """

    def __init__(self, max_entries: int = 32):
        self.max_entries = max_entries
        self._cache: Dict[str, Any] = {}
        self._access_order: list = []

    @staticmethod
    def compute_image_hash(image: Image.Image) -> str:
        """Computes SHA-256 checksum of raw image bytes."""
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        return hashlib.sha256(buffer.getvalue()).hexdigest()

    def get(self, image_hash: str) -> Optional[Any]:
        """Retrieves cached result if available."""
        if image_hash in self._cache:
            api_logger.info(f"[RoomCache] Cache HIT for image hash: {image_hash[:12]}...")
            # Refresh LRU access
            self._access_order.remove(image_hash)
            self._access_order.append(image_hash)
            return self._cache[image_hash]
        api_logger.info(f"[RoomCache] Cache MISS for image hash: {image_hash[:12]}...")
        return None

    def set(self, image_hash: str, analysis_result: Any) -> None:
        """Stores analysis result in cache with LRU eviction."""
        if image_hash in self._cache:
            self._access_order.remove(image_hash)
        elif len(self._cache) >= self.max_entries:
            evicted = self._access_order.pop(0)
            del self._cache[evicted]
            api_logger.info(f"[RoomCache] Evicted LRU cache entry: {evicted[:12]}...")

        self._cache[image_hash] = analysis_result
        self._access_order.append(image_hash)
        api_logger.info(f"[RoomCache] Cached analysis for image hash: {image_hash[:12]} (total cached: {len(self._cache)})")

    def clear(self) -> None:
        """Clears all cached results."""
        self._cache.clear()
        self._access_order.clear()

# Global cache instance
room_cache = RoomAnalysisCache()

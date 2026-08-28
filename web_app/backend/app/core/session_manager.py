import time
import hashlib
from collections import OrderedDict
from threading import Lock
from typing import Optional, Dict, Any, Tuple
import numpy as np
from PIL import Image

from app.config import settings
from app.core.logger import api_logger

class ImageSession:
    """Encapsulates image data, embedding states, and computed masks for a session."""
    def __init__(self, image: Image.Image, image_hash: str):
        self.image = image
        self.image_hash = image_hash
        self.image_id = id(image)
        self.created_at = time.time()
        self.last_accessed = time.time()
        
        # SAM3 Feature Embedding State
        self.sam3_state: Optional[Any] = None
        
        # Surface Detection & Rendering Cache
        self.surface_type: Optional[str] = None
        self.raw_mask: Optional[np.ndarray] = None
        self.composite_mask_b64: Optional[str] = None
        self.last_render_b64: Optional[str] = None
        self.custom_attributes: Dict[str, Any] = {}

    def touch(self):
        self.last_accessed = time.time()

class SessionManager:
    """
    Thread-safe, high-concurrency In-Memory Session & Cache Manager.
    Eliminates unsafe global variable mutations and guarantees state consistency across requests.
    """
    _instance: Optional["SessionManager"] = None
    _lock = Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(SessionManager, cls).__new__(cls)
                cls._instance._init_manager()
            return cls._instance

    def _init_manager(self):
        self._sessions: OrderedDict[str, ImageSession] = OrderedDict()
        self._max_sessions = settings.MAX_CACHED_SESSIONS
        self._ttl_seconds = settings.SESSION_TTL_SECONDS
        self._lock = Lock()

    @staticmethod
    def compute_image_hash(image: Image.Image) -> str:
        """Computes SHA-256 hash of RGB pixel bytes."""
        return hashlib.sha256(image.convert("RGB").tobytes()).hexdigest()

    def set_active_image(self, image: Image.Image, session_id: str = "default") -> ImageSession:
        """Sets or replaces the active image in a thread-safe manner."""
        with self._lock:
            img_rgb = image.convert("RGB")
            img_hash = self.compute_image_hash(img_rgb)
            session = ImageSession(img_rgb, img_hash)
            
            # Maintain LRU eviction
            if session_id in self._sessions:
                del self._sessions[session_id]
            elif len(self._sessions) >= self._max_sessions:
                popped_id, _ = self._sessions.popitem(last=False)
                api_logger.debug(f"[SessionManager] Evicted oldest session '{popped_id}'")

            self._sessions[session_id] = session
            return session

    def get_active_session(self, session_id: str = "default") -> Optional[ImageSession]:
        """Retrieves session and updates LRU position."""
        with self._lock:
            session = self._sessions.get(session_id)
            if session:
                session.touch()
                self._sessions.move_to_end(session_id)
            return session

    def get_active_image(self, session_id: str = "default") -> Optional[Image.Image]:
        """Returns the current active PIL image for the given session."""
        session = self.get_active_session(session_id)
        return session.image if session else None

    def set_surface_mask(
        self,
        surface_type: str,
        raw_mask: np.ndarray,
        composite_mask_b64: Optional[str] = None,
        session_id: str = "default",
    ):
        """Caches detected surface mask bound to the active session."""
        with self._lock:
            session = self._sessions.get(session_id)
            if session:
                session.surface_type = surface_type
                session.raw_mask = raw_mask
                session.composite_mask_b64 = composite_mask_b64
                session.touch()

    def get_surface_mask(self, session_id: str = "default") -> Tuple[Optional[str], Optional[np.ndarray], Optional[str]]:
        """Returns (surface_type, raw_mask, composite_mask_b64) for the active session."""
        session = self.get_active_session(session_id)
        if not session:
            return None, None, None
        return session.surface_type, session.raw_mask, session.composite_mask_b64

    def set_last_render(self, render_b64: str, session_id: str = "default"):
        with self._lock:
            session = self._sessions.get(session_id)
            if session:
                session.last_render_b64 = render_b64
                session.touch()

    def get_last_render(self, session_id: str = "default") -> Optional[str]:
        session = self.get_active_session(session_id)
        return session.last_render_b64 if session else None

    def reset_session(self, session_id: str = "default"):
        """Clears a specific active image session."""
        with self._lock:
            if session_id in self._sessions:
                del self._sessions[session_id]
                api_logger.info(f"[SessionManager] Cleared session '{session_id}'")

    def clear_all(self):
        """Clears all in-memory sessions."""
        with self._lock:
            self._sessions.clear()
            api_logger.info("[SessionManager] Cleared all sessions")

# Global thread-safe session manager instance
session_manager = SessionManager()

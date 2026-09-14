import os
import sys
import gc
import time
from threading import Lock
from pathlib import Path
from typing import Optional, Tuple, Dict, Any, List
import torch
from PIL import Image

from app.config import settings
from app.core.logger import model_logger
from app.core.session_manager import session_manager
from app.core.exceptions import ModelInferenceError, NotFoundError

class SAM3Service:
    """
    High-Performance Singleton Service for managing SAM 3 model lifecycle,
    GPU/CPU inference acceleration, memory management, and session state synchronization.
    """
    
    _instance: Optional["SAM3Service"] = None
    _singleton_lock = Lock()

    def __new__(cls):
        with cls._singleton_lock:
            if cls._instance is None:
                cls._instance = super(SAM3Service, cls).__new__(cls)
                cls._instance._initialize()
            return cls._instance

    def _initialize(self):
        self.model = None
        self.processor = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.checkpoint_path = settings.DEFAULT_CHECKPOINT
        self.is_loaded = False
        self._lock = Lock()
        
        # Backward-compatible property storage
        self._current_image: Optional[Image.Image] = None
        self._current_state: Optional[Any] = None

    @property
    def current_image(self) -> Optional[Image.Image]:
        return session_manager.get_active_image()

    @current_image.setter
    def current_image(self, img: Optional[Image.Image]):
        if img is not None:
            session_manager.set_active_image(img)
        else:
            session_manager.reset_session()

    @property
    def current_state(self) -> Optional[Any]:
        session = session_manager.get_active_session()
        return session.sam3_state if session else None

    @current_state.setter
    def current_state(self, state: Optional[Any]):
        session = session_manager.get_active_session()
        if session:
            session.sam3_state = state

    def load_model(self, checkpoint_path: Optional[str] = None, force_device: Optional[str] = None):
        """Loads or reloads the SAM 3 model on CUDA or CPU dynamically with thread safety."""
        with self._lock:
            target_checkpoint = checkpoint_path or self.checkpoint_path
            
            # Determine target device
            if force_device:
                force_dev_lower = force_device.lower()
                if force_dev_lower == "cuda" and not torch.cuda.is_available():
                    raise ValueError("CUDA (NVIDIA GPU) is not available on this system.")
                self.device = force_dev_lower
            else:
                self.device = "cuda" if torch.cuda.is_available() else "cpu"

            if not os.path.exists(target_checkpoint):
                model_logger.error(f"SAM 3 checkpoint not found at: {target_checkpoint}")
                raise FileNotFoundError(f"SAM 3 checkpoint not found at: {target_checkpoint}")

            # Clean up existing model memory
            if self.model is not None:
                model_logger.info("Releasing existing model weights and clearing GPU cache...")
                del self.model
                del self.processor
                self.model = None
                self.processor = None
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                gc.collect()

            model_logger.info(f"Loading SAM 3 checkpoint from: {target_checkpoint} on {self.device.upper()}...")
            t0 = time.time()

            # Ensure sam3 is on sys.path if needed
            sam3_pkg_dir = str(settings.BASE_DIR / "sam3")
            if sam3_pkg_dir not in sys.path:
                sys.path.append(sam3_pkg_dir)

            from sam3 import build_sam3_image_model
            from sam3.model.sam3_image_processor import Sam3Processor

            self.model = build_sam3_image_model(
                checkpoint_path=target_checkpoint,
                load_from_HF=False,
                device=self.device,
            )
            self.processor = Sam3Processor(self.model, device=self.device)
            self.checkpoint_path = target_checkpoint
            self.is_loaded = True
            
            # Re-embed current active image if one was uploaded
            active_img = self.current_image
            if active_img is not None:
                model_logger.info("Re-computing image embeddings on newly loaded device...")
                with torch.inference_mode():
                    self.current_state = self.processor.set_image(active_img)

            load_time = round(time.time() - t0, 2)
            model_logger.info(f"SAM 3 successfully initialized on {self.device.upper()} in {load_time}s")
            return {
                "device": self.device,
                "load_time_s": load_time,
                "checkpoint": target_checkpoint,
            }

    def ensure_model(self):
        if not self.is_loaded or self.processor is None:
            self.load_model()

    def set_image(self, image: Image.Image) -> Dict[str, Any]:
        """Sets the active image and computes feature embeddings with inference optimization."""
        self.ensure_model()
        img_rgb = image.convert("RGB")
        
        with self._lock:
            session = session_manager.set_active_image(img_rgb)
            model_logger.info(f"Computing feature embeddings for image ({img_rgb.width}x{img_rgb.height}px)...")
            
            with torch.inference_mode():
                if "cuda" in self.device:
                    with torch.autocast(device_type="cuda", dtype=torch.float16):
                        state = self.processor.set_image(img_rgb)
                else:
                    state = self.processor.set_image(img_rgb)

            session.sam3_state = state
            model_logger.info("Feature embeddings computed successfully.")
            
            return {
                "width": img_rgb.width,
                "height": img_rgb.height,
                "status": "ready"
            }

    def segment_text(self, prompt: str, confidence: float = 0.70) -> Dict[str, Any]:
        """Runs text prompt open-vocabulary grounding."""
        self.ensure_model()
        active_img = self.current_image
        state = self.current_state
        
        if active_img is None or state is None:
            raise ValueError("No active image set. Please upload an image first.")

        with self._lock:
            model_logger.info(f"Running text prompt grounding: query='{prompt}', confidence={confidence:.2f}")
            t0 = time.time()
            self.processor.set_confidence_threshold(confidence)
            
            with torch.inference_mode():
                if "cuda" in self.device:
                    with torch.autocast(device_type="cuda", dtype=torch.float16):
                        output = self.processor.set_text_prompt(
                            prompt=prompt,
                            state=state
                        )
                else:
                    output = self.processor.set_text_prompt(
                        prompt=prompt,
                        state=state
                    )
            t1 = time.time()

            masks = output.get("masks", None)
            boxes = output.get("boxes", None)
            exec_ms = round((t1 - t0) * 1000, 2)
            num_found = len(masks) if masks is not None else 0
            model_logger.info(f"Text prompt completed in {exec_ms}ms (found {num_found} objects)")

            return {
                "masks": masks,
                "boxes": boxes.tolist() if isinstance(boxes, torch.Tensor) else boxes,
                "execution_time_ms": exec_ms,
            }

    def segment_points(self, points: List[List[float]], labels: List[int]) -> Dict[str, Any]:
        """Runs interactive point-prompt segmentation."""
        self.ensure_model()
        active_img = self.current_image
        if active_img is None:
            raise ValueError("No active image set. Please upload an image first.")

        with self._lock:
            model_logger.info(f"Running point segmentation with {len(points)} point(s)...")
            t0 = time.time()
            
            with torch.inference_mode():
                state = self.processor.set_image(active_img)
                if "cuda" in self.device:
                    with torch.autocast(device_type="cuda", dtype=torch.float16):
                        output = self.processor.add_point_prompt(
                            points=points,
                            labels=labels,
                            state=state
                        )
                else:
                    output = self.processor.add_point_prompt(
                        points=points,
                        labels=labels,
                        state=state
                    )
            t1 = time.time()

            masks = output.get("masks", None)
            boxes = output.get("boxes", None)
            exec_ms = round((t1 - t0) * 1000, 2)
            num_found = len(masks) if masks is not None else 0
            model_logger.info(f"Point segmentation completed in {exec_ms}ms (found {num_found} regions)")

            return {
                "masks": masks,
                "boxes": boxes.tolist() if isinstance(boxes, torch.Tensor) else boxes,
                "execution_time_ms": exec_ms,
            }

    def reset_session(self):
        """Resets active image session state."""
        with self._lock:
            model_logger.info("Resetting active image session state.")
            session_manager.reset_session()

# Global service instance
sam3_service = SAM3Service()


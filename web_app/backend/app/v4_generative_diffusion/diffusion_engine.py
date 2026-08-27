import io
import time
import base64
import os
import numpy as np
import cv2
import torch
from PIL import Image
from typing import Dict, Any, Optional, Tuple

from app.core import api_logger
from app.v4_generative_diffusion.prompt_architect import prompt_architect

# Default open-weight inpainting model
from pathlib import Path

DEFAULT_INPAINT_MODEL_ID = "runwayml/stable-diffusion-inpainting"
FALLBACK_INPAINT_MODEL_ID = "stabilityai/stable-diffusion-2-inpainting"
LOCAL_MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "models" / "diffusion_inpaint"

class CPUDiffusionEngine:
    """
    High-Performance CPU-Optimized Generative Latent Diffusion Inpainting Engine.
    Executes deep interior architectural restyling, material inpainting, and virtual staging
    using PyTorch CPU multi-threading and DPM++ Karras fast schedulers.
    """

    def __init__(self):
        self.pipe = None
        self.model_id = DEFAULT_INPAINT_MODEL_ID
        self.device = "cpu"
        self.is_loading = False

        # Set multi-core thread count for fast CPU tensor operations
        try:
            num_cores = os.cpu_count() or 8
            torch.set_num_threads(min(num_cores, 8))
            api_logger.info(f"[CPUDiffusionEngine] Initialized with {torch.get_num_threads()} CPU compute threads.")
        except Exception as e:
            api_logger.warning(f"[CPUDiffusionEngine] Thread setting warning: {e}")

    def _get_hf_token(self) -> Optional[str]:
        token = os.environ.get("HF_TOKEN")
        if not token:
            token_path = Path.home() / ".cache" / "huggingface" / "token"
            if token_path.exists():
                try:
                    token = token_path.read_text().strip()
                except Exception:
                    pass
        return token

    def load_pipeline_if_needed(self):
        """Lazy loads the diffusion inpainting pipeline on demand."""
        if self.pipe is not None:
            return

        if self.is_loading:
            while self.is_loading:
                time.sleep(0.5)
            return

        self.is_loading = True
        t0 = time.time()

        try:
            from diffusers import StableDiffusionInpaintPipeline, DPMSolverMultistepScheduler

            # 1. Check if local directory exists first
            if LOCAL_MODEL_PATH.exists() and (LOCAL_MODEL_PATH / "model_index.json").exists():
                api_logger.info(f"[CPUDiffusionEngine] Loading Diffusion Model directly from local directory '{LOCAL_MODEL_PATH}'...")
                self.pipe = StableDiffusionInpaintPipeline.from_pretrained(
                    str(LOCAL_MODEL_PATH),
                    torch_dtype=torch.float32,
                    safety_checker=None,
                    low_cpu_mem_usage=True,
                    local_files_only=True,
                )
            else:
                token = self._get_hf_token()
                api_logger.info(f"[CPUDiffusionEngine] Loading Diffusion Inpainting Model '{self.model_id}' (HF Token: {'Present' if token else 'None'})...")
                self.pipe = StableDiffusionInpaintPipeline.from_pretrained(
                    self.model_id,
                    token=token,
                    torch_dtype=torch.float32,
                    safety_checker=None,
                    low_cpu_mem_usage=True,
                )

                # Save locally for future offline instant loading
                try:
                    LOCAL_MODEL_PATH.mkdir(parents=True, exist_ok=True)
                    self.pipe.save_pretrained(LOCAL_MODEL_PATH)
                    api_logger.info(f"[CPUDiffusionEngine] Cached pipeline locally at '{LOCAL_MODEL_PATH}'.")
                except Exception as save_err:
                    api_logger.warning(f"[CPUDiffusionEngine] Could not cache model locally: {save_err}")

            # Use fast DPMSolver++ Scheduler (Reaches photorealism in 15-20 steps instead of 50)
            self.pipe.scheduler = DPMSolverMultistepScheduler.from_config(
                self.pipe.scheduler.config,
                use_karras_sigmas=True,
                algorithm_type="sde-dpmsolver++"
            )

            # Enable memory slicing for optimal RAM utilization
            if hasattr(self.pipe, "enable_attention_slicing"):
                self.pipe.enable_attention_slicing(1)

            self.pipe.to("cpu")
            load_sec = round(time.time() - t0, 1)
            api_logger.info(f"[CPUDiffusionEngine] Successfully loaded '{self.model_id}' onto CPU in {load_sec}s.")

        except Exception as e:
            api_logger.error(f"[CPUDiffusionEngine] Primary model loading failed: {e}. Trying fallback...", exc_info=True)
            try:
                from diffusers import AutoPipelineForInpainting
                self.pipe = AutoPipelineForInpainting.from_pretrained(
                    FALLBACK_INPAINT_MODEL_ID,
                    torch_dtype=torch.float32,
                    low_cpu_mem_usage=True,
                )
                self.pipe.to("cpu")
            except Exception as e2:
                api_logger.error(f"[CPUDiffusionEngine] Critical error loading inpainting model: {e2}")
                raise RuntimeError(f"Could not initialize CPU diffusion engine: {str(e2)}")
        finally:
            self.is_loading = False

    def restyle_room(
        self,
        original_img: Image.Image,
        mask: Optional[np.ndarray],
        style_preset_id: str = "japandi_minimalist",
        custom_prompt: Optional[str] = None,
        negative_prompt: Optional[str] = None,
        strength: float = 0.75,
        guidance_scale: float = 7.5,
        num_inference_steps: int = 20,
        seed: Optional[int] = None,
        mask_mode: str = "surface_only",
    ) -> Dict[str, Any]:
        """
        Executes generative neural inpainting & room restyling.
        """
        t0 = time.time()
        self.load_pipeline_if_needed()

        w_orig, h_orig = original_img.size

        # 1. Scale down slightly for optimal CPU generation speed (e.g. 768x512 or 512x512)
        target_w = 768
        target_h = int((h_orig / w_orig) * target_w)
        # Ensure dimensions are divisible by 8 for VAE latent downsampling
        target_w = (target_w // 8) * 8
        target_h = (target_h // 8) * 8

        init_image = original_img.resize((target_w, target_h), Image.Resampling.LANCZOS).convert("RGB")

        # 2. Build Inpainting Mask
        if mask is not None and np.any(mask) and mask_mode == "surface_only":
            mask_resized = cv2.resize(mask.astype(np.uint8), (target_w, target_h), interpolation=cv2.INTER_NEAREST)
            # Dilate mask slightly so inpainting blends seamlessly with room boundaries
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
            mask_dilated = cv2.dilate(mask_resized, kernel, iterations=1)
            mask_image = Image.fromarray(mask_dilated * 255, mode="L")
        else:
            # Full Scene Restyle: Inpaint full room with architectural conditioning
            mask_image = Image.fromarray(np.full((target_h, target_w), 255, dtype=np.uint8), mode="L")

        # 3. Construct Architectural Prompt
        prompt_data = prompt_architect.build_prompt(
            style_preset_id=style_preset_id,
            custom_prompt=custom_prompt,
            negative_prompt=negative_prompt,
        )

        pos_prompt = prompt_data["positive_prompt"]
        neg_prompt = prompt_data["negative_prompt"]

        # 4. Set Seed
        if seed is None or seed < 0:
            seed = int(time.time() * 1000) % (2**31 - 1)
        generator = torch.Generator(device="cpu").manual_seed(seed)

        api_logger.info(
            f"[CPUDiffusionEngine] Starting Inpaint: style='{prompt_data['style_name']}', "
            f"steps={num_inference_steps}, strength={strength:.2f}, seed={seed}"
        )

        # 5. Execute Latent Diffusion Inpainting Pass on CPU
        with torch.no_grad():
            output = self.pipe(
                prompt=pos_prompt,
                negative_prompt=neg_prompt,
                image=init_image,
                mask_image=mask_image,
                strength=strength,
                guidance_scale=guidance_scale,
                num_inference_steps=num_inference_steps,
                generator=generator,
            )

        generated_pil = output.images[0]

        # 6. Upscale back to original resolution with Lanczos-4
        if (target_w, target_h) != (w_orig, h_orig):
            generated_pil = generated_pil.resize((w_orig, h_orig), Image.Resampling.LANCZOS)

        # 7. Convert to Base64
        buf = io.BytesIO()
        generated_pil.save(buf, format="JPEG", quality=95, optimize=True)
        img_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

        exec_ms = round((time.time() - t0) * 1000, 1)
        api_logger.info(
            f"[CPUDiffusionEngine] Finished Generative Inpainting in {exec_ms}ms ({exec_ms/1000:.1f}s) on CPU."
        )

        return {
            "generated_image_base64": img_b64,
            "generated_pil": generated_pil,
            "execution_time_ms": exec_ms,
            "style_preset": style_preset_id,
            "prompt_used": pos_prompt,
            "negative_prompt_used": neg_prompt,
            "seed_used": seed,
            "steps_executed": num_inference_steps,
        }

cpu_diffusion_engine = CPUDiffusionEngine()

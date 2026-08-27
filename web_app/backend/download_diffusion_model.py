"""
Dedicated Downloader for AI Diffusion Inpainting Models.
Downloads model weights directly from Hugging Face with your token
and caches them locally inside web_app/backend/data/models/diffusion_inpaint.
"""
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
LOCAL_MODEL_DIR = BACKEND_DIR / "data" / "models" / "diffusion_inpaint"
MODEL_ID = "runwayml/stable-diffusion-inpainting"

def download_and_cache_locally():
    print("=" * 60)
    print(" SAM 3 V4.0 — AI Diffusion Model Downloader")
    print(f" Target Model : {MODEL_ID}")
    print(f" Local Target : {LOCAL_MODEL_DIR}")
    print("=" * 60)

    LOCAL_MODEL_DIR.mkdir(parents=True, exist_ok=True)

    # Read HF token if available in cache or env
    token = os.environ.get("HF_TOKEN")
    if not token:
        token_path = Path.home() / ".cache" / "huggingface" / "token"
        if token_path.exists():
            token = token_path.read_text().strip()
            print("[OK] Detected Hugging Face Token from user profile cache.")

    print("\n[1/2] Downloading model weights from Hugging Face...")
    from diffusers import StableDiffusionInpaintPipeline
    import torch

    pipe = StableDiffusionInpaintPipeline.from_pretrained(
        MODEL_ID,
        token=token,
        torch_dtype=torch.float32,
        low_cpu_mem_usage=True,
    )

    print(f"\n[2/2] Saving full pipeline locally to '{LOCAL_MODEL_DIR}'...")
    pipe.save_pretrained(LOCAL_MODEL_DIR)

    print("\n" + "=" * 60)
    print("[OK] Model successfully downloaded and saved locally!")
    print(f"[OK] Location: {LOCAL_MODEL_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    download_and_cache_locally()

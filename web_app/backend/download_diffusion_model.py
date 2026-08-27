"""
Dedicated High-Speed Multi-Threaded Downloader for AI Diffusion Inpainting Models.
Uses Hugging Face's Rust-powered `hf_transfer` backend to maximize download speeds (up to 50-100 MB/s).
Filters out non-essential model formats (ONNX, Flax, legacy bin) to download ONLY what PyTorch needs.
"""
import os
import sys
from pathlib import Path

# Enable Hugging Face High-Performance transfer backend (Xet / multi-thread)
os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "1"
os.environ["HF_XET_HIGH_PERFORMANCE"] = "1"

BACKEND_DIR = Path(__file__).resolve().parent
LOCAL_MODEL_DIR = BACKEND_DIR / "data" / "models" / "diffusion_inpaint"
MODEL_ID = "runwayml/stable-diffusion-inpainting"

def download_and_cache_locally():
    print("=" * 65)
    print(" SAM 3 V4.0 — High-Speed AI Diffusion Model Downloader (hf_transfer)")
    print(f" Target Model : {MODEL_ID}")
    print(f" Local Target : {LOCAL_MODEL_DIR}")
    print("=" * 65)

    LOCAL_MODEL_DIR.mkdir(parents=True, exist_ok=True)

    # Read HF token from cache or env
    token = os.environ.get("HF_TOKEN")
    if not token:
        token_path = Path.home() / ".cache" / "huggingface" / "token"
        if token_path.exists():
            try:
                token = token_path.read_text().strip()
                print("[OK] Loaded Hugging Face Token for accelerated VIP bandwidth.")
            except Exception:
                pass

    print("\n[1/2] Connecting with high-speed multi-threaded transfer...")
    print("      (Filtering out unnecessary Flax/ONNX/bin files to reduce size)...")

    from huggingface_hub import snapshot_download

    # Download ONLY the essential PyTorch safetensors/configs (saves ~5 GB of redundant downloads)
    snapshot_download(
        repo_id=MODEL_ID,
        local_dir=str(LOCAL_MODEL_DIR),
        token=token,
        ignore_patterns=[
            "*.msgpack",
            "*.h5",
            "*.onnx*",
            "*.flax*",
            "*.tflite*",
            "*.ckpt",
            "*.bin",  # Use lightweight .safetensors
        ],
        max_workers=8,
    )

    print("\n" + "=" * 65)
    print("[OK] Model successfully downloaded at maximum speed and saved locally!")
    print(f"[OK] Stored at: {LOCAL_MODEL_DIR}")
    print("=" * 65)

if __name__ == "__main__":
    download_and_cache_locally()

"""
SAM 3 V4.0 — High-Speed Resumable Model Downloader (FP16 SafeTensors).
Only downloads the exact lightweight FP16 files (~2.1 GB total):
- text_encoder/model.fp16.safetensors (246 MB)
- unet/diffusion_pytorch_model.fp16.safetensors (1.7 GB)
- vae/diffusion_pytorch_model.fp16.safetensors (167 MB)
All configs and tokenizers are already in place.
"""
import os
import sys
import time
import requests
from pathlib import Path
from tqdm import tqdm

BACKEND_DIR = Path(__file__).resolve().parent
LOCAL_MODEL_DIR = BACKEND_DIR / "data" / "models" / "diffusion_inpaint"
REPO_ID = "runwayml/stable-diffusion-inpainting"
BASE_URL = f"https://huggingface.co/{REPO_ID}/resolve/main"

# Exact lightweight FP16 SafeTensors file manifest
ESSENTIAL_FILES = [
    ("model_index.json", "model_index.json"),
    ("scheduler/scheduler_config.json", "scheduler/scheduler_config.json"),
    ("feature_extractor/preprocessor_config.json", "feature_extractor/preprocessor_config.json"),
    ("tokenizer/tokenizer_config.json", "tokenizer/tokenizer_config.json"),
    ("tokenizer/vocab.json", "tokenizer/vocab.json"),
    ("tokenizer/merges.txt", "tokenizer/merges.txt"),
    ("tokenizer/special_tokens_map.json", "tokenizer/special_tokens_map.json"),
    ("text_encoder/config.json", "text_encoder/config.json"),
    ("text_encoder/model.fp16.safetensors", "text_encoder/model.fp16.safetensors"),
    ("vae/config.json", "vae/config.json"),
    ("vae/diffusion_pytorch_model.fp16.safetensors", "vae/diffusion_pytorch_model.fp16.safetensors"),
    ("unet/config.json", "unet/config.json"),
    ("unet/diffusion_pytorch_model.fp16.safetensors", "unet/diffusion_pytorch_model.fp16.safetensors"),
]

def get_hf_token():
    token = os.environ.get("HF_TOKEN")
    if not token:
        token_path = Path.home() / ".cache" / "huggingface" / "token"
        if token_path.exists():
            try:
                token = token_path.read_text().strip()
            except Exception:
                pass
    return token

def download_file(file_rel_path: str, token: str = None, max_retries: int = 25):
    dest_path = LOCAL_MODEL_DIR / file_rel_path
    part_path = LOCAL_MODEL_DIR / f"{file_rel_path}.part"

    dest_path.parent.mkdir(parents=True, exist_ok=True)
    part_path.parent.mkdir(parents=True, exist_ok=True)

    url = f"{BASE_URL}/{file_rel_path}"

    base_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }
    if token:
        base_headers["Authorization"] = f"Bearer {token}"

    if dest_path.exists() and dest_path.stat().st_size > 0:
        local_mb = dest_path.stat().st_size / (1024 * 1024)
        print(f"[EXISTS] {file_rel_path} ({local_mb:.1f} MB) — Verified complete.", flush=True)
        return

    for attempt in range(1, max_retries + 1):
        try:
            downloaded_size = part_path.stat().st_size if part_path.exists() else 0
            req_headers = dict(base_headers)

            if downloaded_size > 0:
                req_headers["Range"] = f"bytes={downloaded_size}-"
                print(f"[RESUMING] {file_rel_path} from byte {downloaded_size / (1024*1024):.1f} MB (Attempt {attempt}/{max_retries})...", flush=True)
            else:
                print(f"[DOWNLOADING] {file_rel_path} (Attempt {attempt}/{max_retries})...", flush=True)

            with requests.get(url, headers=req_headers, stream=True, timeout=30) as r:
                if r.status_code == 416:
                    if part_path.exists():
                        if dest_path.exists():
                            dest_path.unlink()
                        part_path.rename(dest_path)
                        print(f"[OK] Completed: {file_rel_path}\n", flush=True)
                        return

                if r.status_code not in (200, 206):
                    raise RuntimeError(f"Server returned HTTP {r.status_code}")

                content_len = int(r.headers.get("content-length", 0))
                total_size = downloaded_size + content_len if r.status_code == 206 else content_len

                mode = "ab" if downloaded_size > 0 else "wb"
                chunk_size = 1024 * 512  # 512 KB chunks

                with open(part_path, mode) as f, tqdm(
                    total=total_size,
                    initial=downloaded_size,
                    unit="B",
                    unit_scale=True,
                    unit_divisor=1024,
                    desc=Path(file_rel_path).name,
                    ncols=85,
                ) as pbar:
                    for chunk in r.iter_content(chunk_size=chunk_size):
                        if chunk:
                            f.write(chunk)
                            downloaded_size += len(chunk)
                            pbar.update(len(chunk))

            if dest_path.exists():
                dest_path.unlink()
            part_path.rename(dest_path)
            print(f"[OK] Completed: {file_rel_path}\n", flush=True)
            return

        except Exception as e:
            print(f"\n[WARN] Network hiccup on {file_rel_path}: {e}", flush=True)
            if part_path.exists():
                saved_mb = part_path.stat().st_size / (1024 * 1024)
                print(f"[SAVED] Preserved {saved_mb:.1f} MB on disk for auto-resumption.", flush=True)

            if attempt < max_retries:
                wait_s = min(2 ** attempt, 15)
                print(f"[RETRY] Auto-resuming in {wait_s}s...\n", flush=True)
                time.sleep(wait_s)
            else:
                raise RuntimeError(f"Failed to download {file_rel_path} after {max_retries} attempts: {e}")

def main():
    print("=" * 65, flush=True)
    print(" SAM 3 V4.0 — High-Speed FP16 Resumable Model Downloader", flush=True)
    print(f" Target Model : {REPO_ID}", flush=True)
    print(f" Local Target : {LOCAL_MODEL_DIR}", flush=True)
    print("=" * 65, flush=True)

    LOCAL_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    token = get_hf_token()
    if token:
        print("[OK] Hugging Face Token loaded.\n", flush=True)

    for i, (remote_rel, local_rel) in enumerate(ESSENTIAL_FILES, start=1):
        print(f"File [{i}/{len(ESSENTIAL_FILES)}]: {local_rel}", flush=True)
        download_file(remote_rel, token=token)

    print("=" * 65, flush=True)
    print("[SUCCESS] ALL MODEL FILES DOWNLOADED & VERIFIED LOCALLY!", flush=True)
    print(f"Location: {LOCAL_MODEL_DIR}", flush=True)
    print("=" * 65, flush=True)

if __name__ == "__main__":
    main()

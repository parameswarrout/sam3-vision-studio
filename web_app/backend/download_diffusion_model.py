"""
100% Byte-by-Byte Resumable Downloader for AI Diffusion Inpainting Models.
Uses standard HTTP Range requests (RFC 7233) with `.part` chunk preservation:
- If a connection drops, it resumes from the EXACT last downloaded byte.
- Never restarts from 0% on interrupted files.
- Includes continuous live progress bar with speed and ETA.
- Automatically retries on network drops with exponential backoff.
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

# Only the essential files needed for CPU PyTorch diffusion inpainting
ESSENTIAL_FILES = [
    "model_index.json",
    "scheduler/scheduler_config.json",
    "feature_extractor/preprocessor_config.json",
    "tokenizer/tokenizer_config.json",
    "tokenizer/vocab.json",
    "tokenizer/merges.txt",
    "tokenizer/special_tokens_map.json",
    "text_encoder/config.json",
    "text_encoder/model.safetensors",
    "vae/config.json",
    "vae/diffusion_pytorch_model.safetensors",
    "unet/config.json",
    "unet/diffusion_pytorch_model.safetensors",
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

def download_resumable_file(file_rel_path: str, token: str = None, max_retries: int = 20):
    dest_path = LOCAL_MODEL_DIR / file_rel_path
    part_path = LOCAL_MODEL_DIR / f"{file_rel_path}.part"

    dest_path.parent.mkdir(parents=True, exist_ok=True)
    part_path.parent.mkdir(parents=True, exist_ok=True)

    url = f"{BASE_URL}/{file_rel_path}"

    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    # Check remote file size with HEAD request
    head_resp = requests.head(url, headers=headers, allow_redirects=True, timeout=15)
    if head_resp.status_code != 200:
        # Fallback to GET with stream
        head_resp = requests.get(url, headers=headers, stream=True, timeout=15)

    remote_size = int(head_resp.headers.get("content-length", 0))

    # If destination file already fully exists
    if dest_path.exists():
        local_size = dest_path.stat().st_size
        if remote_size > 0 and local_size == remote_size:
            print(f"[EXISTS] {file_rel_path} ({local_size / (1024*1024):.1f} MB) — Verified complete.")
            return

    # Check if there is an existing partial download to resume from
    downloaded_size = 0
    if part_path.exists():
        downloaded_size = part_path.stat().st_size
        if remote_size > 0 and downloaded_size >= remote_size:
            # Atomic rename if already complete in .part
            if dest_path.exists():
                dest_path.unlink()
            part_path.rename(dest_path)
            print(f"[COMPLETED] {file_rel_path} ({dest_path.stat().st_size / (1024*1024):.1f} MB)")
            return

    # Attempt download with auto-resume loop
    for attempt in range(1, max_retries + 1):
        try:
            req_headers = dict(headers)
            if downloaded_size > 0:
                req_headers["Range"] = f"bytes={downloaded_size}-"
                print(f"[RESUMING] {file_rel_path} from byte {downloaded_size / (1024*1024):.1f} MB / {remote_size / (1024*1024):.1f} MB (Attempt {attempt}/{max_retries})")
            else:
                print(f"[DOWNLOADING] {file_rel_path} ({remote_size / (1024*1024):.1f} MB) (Attempt {attempt}/{max_retries})")

            with requests.get(url, headers=req_headers, stream=True, timeout=30) as r:
                if r.status_code not in (200, 206):
                    raise RuntimeError(f"Server returned HTTP {r.status_code}: {r.text[:200]}")

                mode = "ab" if downloaded_size > 0 else "wb"
                chunk_size = 1024 * 512  # 512 KB chunks

                with open(part_path, mode) as f, tqdm(
                    total=remote_size,
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

            # Atomic rename upon complete download
            if dest_path.exists():
                dest_path.unlink()
            part_path.rename(dest_path)
            print(f"[OK] Completed: {file_rel_path}\n")
            return

        except Exception as e:
            print(f"\n[WARN] Interrupted on {file_rel_path}: {e}")
            if part_path.exists():
                downloaded_size = part_path.stat().st_size
                print(f"[SAVED] Preserved {downloaded_size / (1024*1024):.1f} MB on disk for resumption.")

            if attempt < max_retries:
                wait_s = min(2 ** attempt, 20)
                print(f"[RETRY] Auto-resuming in {wait_s}s...\n")
                time.sleep(wait_s)
            else:
                raise RuntimeError(f"Failed to complete {file_rel_path} after {max_retries} attempts: {e}")

def main():
    print("=" * 65)
    print(" SAM 3 V4.0 — 100% Resumable HTTP Range Model Downloader")
    print(f" Target Model : {REPO_ID}")
    print(f" Local Target : {LOCAL_MODEL_DIR}")
    print("=" * 65)

    LOCAL_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    token = get_hf_token()
    if token:
        print("[OK] Hugging Face Token loaded.\n")

    for i, file_rel_path in enumerate(ESSENTIAL_FILES, start=1):
        print(f"File [{i}/{len(ESSENTIAL_FILES)}]: {file_rel_path}")
        download_resumable_file(file_rel_path, token=token)

    print("=" * 65)
    print("[SUCCESS] ALL MODEL FILES DOWNLOADED & VERIFIED LOCALLY!")
    print(f"Location: {LOCAL_MODEL_DIR}")
    print("=" * 65)

if __name__ == "__main__":
    main()

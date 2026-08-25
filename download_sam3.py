import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import huggingface_hub
from huggingface_hub import snapshot_download, HfApi

def main():
    print("=" * 65)
    print("      SAM 3 Resumable Local Model Downloader with Progress")
    print("=" * 65)

    # 1. Load HF_TOKEN from .env file
    env_path = Path(".env").resolve()
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        print("[OK] Loaded .env file.")
    else:
        print("[!] .env file not found.")

    hf_token = os.getenv("HF_TOKEN")
    if hf_token:
        print("[OK] HF_TOKEN found in environment.")
        try:
            huggingface_hub.login(token=hf_token)
            print("[OK] Successfully authenticated with Hugging Face Hub.")
        except Exception as e:
            print(f"[!] Authentication notice: {e}")
    else:
        print("[!] WARNING: HF_TOKEN is not set in .env. SAM 3 requires access approval on Hugging Face.")

    model_id = "facebook/sam3"
    target_dir = Path("models/sam3").resolve()
    target_dir.mkdir(parents=True, exist_ok=True)

    print(f"\nModel ID: {model_id}")
    print(f"Target Cache Folder: {target_dir}")

    # 2. Fetch repository file metadata for progress visibility
    try:
        api = HfApi(token=hf_token)
        repo_files = api.list_repo_files(repo_id=model_id)
        print(f"[INFO] Found {len(repo_files)} repository files to check/download:")
        for file_name in repo_files[:10]:
            print(f"  - {file_name}")
        if len(repo_files) > 10:
            print(f"  ... and {len(repo_files) - 10} more files.")
    except Exception as e:
        print(f"[!] Could not list repo files upfront: {e}")

    print("\nStarting resumable download... (If interrupted, rerun this script to resume)")
    print("-" * 65)

    # 3. Perform resumable download with progress bars
    try:
        downloaded_path = snapshot_download(
            repo_id=model_id,
            local_dir=str(target_dir),
            token=hf_token,
            max_workers=4,
            tqdm_class=None  # Uses default tqdm progress bars
        )
        print("-" * 65)
        print(f"\n[SUCCESS] Download complete!")
        print(f"SAM 3 model is ready at: {target_dir}")
    except Exception as e:
        print("-" * 65)
        print(f"\n[!] Download error / interrupted: {e}")
        print("\nTip: Re-run `python download_sam3.py` anytime to automatically resume your download from where it left off.")

if __name__ == "__main__":
    main()

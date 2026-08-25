# Meta Segment Anything Model 3 (SAM 3) — Vision Studio & Modular Fullstack API

<div align="center">

![Meta SAM 3](https://img.shields.io/badge/Meta%20AI-Segment%20Anything%203-indigo?style=for-the-badge&logo=meta)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20Python-009688?style=for-the-badge&logo=fastapi)
![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014-black?style=for-the-badge&logo=next.js)
![PyTorch](https://img.shields.io/badge/Compute-NVIDIA%20CUDA%20%7C%20CPU-EE4C2C?style=for-the-badge&logo=pytorch)

### High-performance, decoupled web studio and REST API for open-vocabulary grounding, interactive point segmentation, and autonomous room surface analysis powered by Meta SAM 3.

</div>

---

## 📖 Table of Contents
- [✨ Key Features](#-key-features)
- [🏛️ SAM 3 V2 — Automatic Room Analysis](#️-sam-3-v2--automatic-room-analysis)
- [📁 Repository Structure](#-repository-structure)
- [⚡ Quick Start (1-Click Launch)](#-quick-start-1-click-launch)
- [🛠️ Manual Setup](#️-manual-setup)
- [🔌 API Specification](#-api-specification)
- [🧠 LLM & IDE Context Documentation](#-llm--ide-context-documentation)

---

## ✨ Key Features

* 🚀 **Decoupled Architecture:** Clean separation of concerns between the **FastAPI Python Backend** (model inference, GPU tensor state) and the **Next.js 14 UI** (reactive canvas, interactive point pins).
* 🏛️ **V2 Autonomous Room Analysis:** One-click interior room scene understanding. Automatically extracts multi-plane walls, floor, ceiling, windows, doors, and furniture with hierarchical opening carve-outs.
* ⚡ **Hardware Acceleration & Dynamic Switching:** Auto-detects NVIDIA CUDA GPU with real-time UI toggle to switch between **CUDA GPU** and **CPU Mode** on the fly.
* 🖼️ **Dual-Pane Full-Width Canvas:** Gradio-style split workspace (Input Image Left / Live Segmented Masks Right) with zero vertical scroll overflow.
* 🔍 **Open-Vocabulary Text Grounding:** Segment any arbitrary visual concept (`"person"`, `"sports car"`, `"sneakers"`) with a responsive confidence slider.
* 🎯 **Interactive Positive & Negative Points:** Add positive points (`+` / Left Click) to include regions and negative points (`-` / Right Click) to exclude background items with real-time undo and clear.
* 📊 **Production-Grade Structured Logging:** Standardized namespaced logging across all modules (`sam3.server`, `sam3.model`, `sam3.api`).

---

## 🏛️ SAM 3 V2 — Automatic Room Analysis

The V2 module (`/room-analysis`) brings autonomous indoor architectural surface parsing:
1. **Multi-Plane Walls:** Disambiguates complex indoor rooms into distinct wall facets (`wall_1`, `wall_2`, `wall_3` — Left, Center, Right Wall Planes).
2. **Hierarchical Topological Carving:** Openings (Windows & Doors) are structurally carved out from wall masks; occluding Furniture is carved out from floors.
3. **Multi-Signal Confidence Scoring:** Combines SAM logits, 3D spatial priors, shape solidity, and intersection penalties.
4. **SHA-256 LRU Image Cache:** Instant cache retrieval on identical images without redundant GPU re-inference.
5. **Interactive UI:** Real-time mask opacity slider, category filter chips (Walls, Floor, Openings, Furniture), and individual layer eye show/hide toggles.

> For deep architectural details and mathematical formulations, see [**`V2_ROOM_ANALYSIS.md`**](./V2_ROOM_ANALYSIS.md).

---

## 📁 Repository Structure

```text
├── PROJECT_CONTEXT.md         # Master Architecture and LLM/IDE Reference Guide
├── V2_ROOM_ANALYSIS.md        # Dedicated SAM 3 V2 Room Analysis Specification
├── .cursorrules               # AI IDE instructions for Cursor, Windsurf, Copilot
├── download_sam3.py           # Checkpoint downloader from Hugging Face
│
├── sam3/                      # Meta SAM 3 Model Engine & Weights
│   ├── checkpoints/sam3.pt    # 3.45 GB Foundation Model Checkpoint
│   └── sam3/                  # ViT backbone, attention layers, model builder
│
└── web_app/                   # Full-Stack Application
    ├── launch_all.bat         # 1-Click Windows Launcher
    ├── backend/               # FastAPI Server (Port 8000)
    │   ├── run.py             # Server runner with path resolution
    │   └── app/
    │       ├── core/          # sam3_service.py, mask_engine.py, logger.py
    │       ├── room_analysis/ # analyzer, detector, mask_refiner, classifier, cache
    │       ├── schemas/       # Strict Pydantic schemas (requests.py, room.py)
    │       └── api/v1/        # REST endpoints (health, image, text, points, room)
    └── frontend/              # Next.js 14 Web Studio (Port 3000/3001/3002)
        └── src/
            ├── app/           # page.js (V1 Manual), room-analysis/page.js (V2)
            ├── components/    # canvas/, common/, room-analysis/
            ├── hooks/         # useSamSession.js, useRoomAnalysis.js, useBackendHealth.js
            └── lib/           # api.js (XMLHttpRequest progress client)
```

---

## ⚡ Quick Start (1-Click Launch)

Run the included batch launcher to start both servers automatically:

```cmd
cd web_app
launch_all.bat
```

Once launched:
* **Manual Segmentation (V1):** [`http://localhost:3000`](http://localhost:3000) (or `http://localhost:3001` / `http://localhost:3002`)
* **Room Analysis (V2):** [`http://localhost:3000/room-analysis`](http://localhost:3000/room-analysis)
* **Interactive API Docs:** [`http://127.0.0.1:8000/api/v1/docs`](http://127.0.0.1:8000/api/v1/docs)

---

## 🛠️ Manual Setup

### 1. Backend (FastAPI)
```bash
cd web_app/backend
pip install -r requirements.txt
python run.py
```

### 2. Frontend (Next.js)
```bash
cd web_app/frontend
npm install
npm run dev
```

---

## 🔌 API Specification

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/health` | `GET` | Server health, active compute device, and model readiness |
| `/api/v1/device/switch` | `POST` | Dynamically re-allocate weights to `"cuda"` or `"cpu"` |
| `/api/v1/analyze-room` | `POST` | **V2 Autonomous Room Analysis** (Walls, Floor, Openings, Furniture) |
| `/api/v1/set-image` | `POST` | Upload target image and compute ViT feature embeddings |
| `/api/v1/segment-text` | `POST` | Open-vocabulary text prompt grounding |
| `/api/v1/segment-points`| `POST` | Interactive coordinate point segmentation |
| `/api/v1/reset` | `POST` | Clear active image session cache in memory |

---

## 🧠 LLM & IDE Context Documentation

* [**`PROJECT_CONTEXT.md`**](./PROJECT_CONTEXT.md) — Master LLM context, architectural diagrams, state management, and file index.
* [**`V2_ROOM_ANALYSIS.md`**](./V2_ROOM_ANALYSIS.md) — Complete specification for SAM 3 V2 Automatic Room Analysis.

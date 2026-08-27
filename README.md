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

> For deep architectural details and mathematical formulations, see [**`V2_ROOM_ANALYSIS.md`**](./V2_ROOM_ANALYSIS.md).

---

## 🧱 SAM 3 V3.0 — Neural Perspective & PBR Room Tile Visualizer

The V3.0 module (`/v3-tile-visualizer`) brings Physics-Based Rendering (PBR) and RANSAC perspective alignment:
1. **RANSAC Architectural Vanishing Point:** Hough line detection and RANSAC consensus clustering automatically align perspective homography with room baseboards.
2. **3D Normal Bump Mapping:** Dynamic Sobel spatial gradients generate tactile 3D relief for natural stone clefts and wood pores.
3. **Grout Crevices with Ambient Occlusion (AO):** Distance transform profiling deepens shadow crevices along tile seams.
4. **Schlick's Fresnel Window Reflections:** Inverts and re-projects window daylight and room chandelier reflections with roughness bloom onto high-gloss marble.
5. **16 Real MyTyles Varieties:** Authentic catalog with calibrated roughness and specularity downloaded directly from MyTyles.com.

> For complete technical and mathematical specifications, see [**`V3_TILE_VISUALIZER_PBR_ARCHITECTURE.md`**](./V3_TILE_VISUALIZER_PBR_ARCHITECTURE.md) and [**`V2_5_TILE_VISUALIZER_ARCHITECTURE.md`**](./V2_5_TILE_VISUALIZER_ARCHITECTURE.md).

---

## 📁 Repository Structure

```text
├── PROJECT_CONTEXT.md                     # Master Architecture and LLM/IDE Reference Guide
├── V3_TILE_VISUALIZER_PBR_ARCHITECTURE.md # Dedicated SAM 3 V3.0 PBR Tile Visualizer Specification
├── V2_5_TILE_VISUALIZER_ARCHITECTURE.md   # Dedicated SAM 3 V2.5 Tile Visualizer Specification
├── V2_ROOM_ANALYSIS.md                    # Dedicated SAM 3 V2 Room Analysis Specification
├── .cursorrules                           # AI IDE instructions for Cursor, Windsurf, Copilot
├── download_sam3.py                       # Checkpoint downloader from Hugging Face
│
├── sam3/                                  # Meta SAM 3 Model Engine & Weights
│   ├── checkpoints/sam3.pt                # 3.45 GB Foundation Model Checkpoint
│   └── sam3/                              # ViT backbone, attention layers, model builder
│
└── web_app/                               # Full-Stack Application
    ├── launch_all.bat                     # 1-Click Windows Launcher
    ├── backend/                           # FastAPI Server (Port 8000)
    │   ├── run.py                         # Server runner with path resolution
    │   └── app/
    │       ├── core/                      # sam3_service.py, mask_engine.py, logger.py
    │       ├── room_analysis/             # V2 Analyzer, detector, refiner, classifier
    │       ├── v2_5_tile_visualizer/      # V2.5 Tile Visualizer package
    │       ├── v3_tile_visualizer/        # V3.0 Neural PBR & RANSAC Tile Visualizer package
    │       ├── schemas/                   # Pydantic schemas (v3_tile.py, v2_5_tile.py, room.py)
    │       └── api/v1/                    # REST endpoints (health, image, text, points, room, v2.5, v3)
    └── frontend/                          # Next.js 14 Web Studio (Port 3000)
        └── src/
            ├── app/                       # / (V1), /room-analysis (V2), /tile-visualizer (V2.5), /v3-tile-visualizer (V3.0)
            ├── components/                # v3_tile_visualizer/, v2_5_tile_visualizer/, room-analysis/, common/
            ├── hooks/                     # useTileVisualizerV3.js, useTileVisualizer.js, useRoomAnalysis.js
            └── lib/                       # api.js (V1, V2, V2.5, V3 client methods)
```

---

## ⚡ Quick Start (1-Click Launch)

Run the included batch launcher to start both servers automatically:

```cmd
cd web_app
launch_all.bat
```

Once launched:
* **Manual Segmentation (V1):** [`http://localhost:3000`](http://localhost:3000)
* **Room Analysis (V2):** [`http://localhost:3000/room-analysis`](http://localhost:3000/room-analysis)
* **Tile Visualizer (V2.5):** [`http://localhost:3000/tile-visualizer`](http://localhost:3000/tile-visualizer)
* **PBR Visualizer (V3.0):** [`http://localhost:3000/v3-tile-visualizer`](http://localhost:3000/v3-tile-visualizer)
* **Interactive API Docs:** [`http://127.0.0.1:8000/api/v1/docs`](http://127.0.0.1:8000/api/v1/docs)

---

## 🔌 API Specification

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/health` | `GET` | Server health, active compute device, and model readiness |
| `/api/v1/device/switch` | `POST` | Dynamically re-allocate weights to `"cuda"` or `"cpu"` |
| `/api/v1/analyze-room` | `POST` | **V2 Autonomous Room Analysis** (Walls, Floor, Openings, Furniture) |
| `/api/v1/v3/tiles/detect-surface` | `POST` | **V3.0 SAM 3 Surface Grounding** (with obstacle carving) |
| `/api/v1/v3/tiles/render-tile` | `POST` | **V3.0 PBR Tile Synthesis** (RANSAC VP, Sobel Bump, Fresnel) |
| `/api/v1/v3/tiles/catalog` | `GET` | **V3.0 MyTyles 16-Tile Catalog** with physical properties |
| `/api/v1/set-image` | `POST` | Upload target image and compute ViT feature embeddings |
| `/api/v1/segment-text` | `POST` | Open-vocabulary text prompt grounding |
| `/api/v1/segment-points`| `POST` | Interactive coordinate point segmentation |
| `/api/v1/reset` | `POST` | Clear active image session cache in memory |

---

## 🧠 LLM & IDE Context Documentation

* [**`V3_TILE_VISUALIZER_PBR_ARCHITECTURE.md`**](./V3_TILE_VISUALIZER_PBR_ARCHITECTURE.md) — Master V3.0 specification for Neural Perspective, PBR Normal Mapping, Grout AO, and Fresnel Reflections.
* [**`V2_5_TILE_VISUALIZER_ARCHITECTURE.md`**](./V2_5_TILE_VISUALIZER_ARCHITECTURE.md) — Complete specification for SAM 3 V2.5 Tile Visualizer.
* [**`V2_ROOM_ANALYSIS.md`**](./V2_ROOM_ANALYSIS.md) — Complete specification for SAM 3 V2 Automatic Room Analysis.
* [**`PROJECT_CONTEXT.md`**](./PROJECT_CONTEXT.md) — Master architectural overview, state management, and full file index.

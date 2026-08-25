# Meta Segment Anything Model 3 (SAM 3) — Full Project Context & Architecture Guide

> **Target Audience:** AI Coding Assistants (LLMs, Cursor, Antigravity, Copilot) & Software Engineers.  
> **Repository Purpose:** Production-grade web interface and decoupled REST API for Meta SAM 3 (Segment Anything 3) open-vocabulary concept segmentation, interactive point-prompting, and autonomous room surface analysis.

---

## 1. Project Overview & Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Model Engine** | Meta SAM 3 (`sam3.pt`, 3.45 GB) | Vision Foundation model for Open-Vocabulary Grounding & Interactive Point Masking |
| **V2 Room Engine** | `app/v2_room_analysis/` | Decoupled depth & geometry, evidence-based wall separation, confidence-aware occlusion |
| **Backend API** | Python 3.11, FastAPI, Uvicorn, PyTorch | Asynchronous REST service for image embedding caching, mask rendering, and device management |
| **Mask Processing** | OpenCV / PIL / NumPy / SciPy Engine | Color-palette mask alpha blending, bounding box labeling, and Base64 stream encoding |
| **Frontend UI** | Next.js 14 (App Router), Tailwind CSS, Lucide | Dual-pane manual segmentation studio (`/`) & autonomous room analysis workspace (`/room-analysis`) |
| **Hardware** | NVIDIA CUDA (GPU) & CPU Fallback | Dynamic hot-swapping between CUDA GPU and CPU execution |

---

## 2. Complete Repository Directory Structure

```text
Segmentation_model_by_meta/
├── .cursorrules                         # AI IDE context rule definition
├── PROJECT_CONTEXT.md                   # Complete LLM/developer reference (this file)
├── V2_ROOM_ANALYSIS.md                  # Dedicated SAM 3 V2 Room Analysis Specification
├── ARCHITECTURE.md                      # Detailed data flow, schemas & system architecture
├── README.md                            # Main project overview & quickstart
├── download_sam3.py                     # Checkpoint downloader script from Hugging Face
│
├── sam3/                                # Meta SAM 3 Core Architecture (Engine Submodule)
│   ├── checkpoints/
│   │   └── sam3.pt                      # 3.45 GB Model Weights
│   ├── sam3/                            # Python model builder & predictors
│   │   ├── model_builder.py             # build_sam3_image_model() factory
│   │   ├── model/                       # ViT backbone, memory, necks, attention
│   │   └── sam3_image_processor.py      # Sam3Processor (set_image, set_text_prompt, add_point_prompt)
│   └── app.py                           # Legacy Gradio reference implementation
│
└── web_app/                             # Decoupled Full-Stack Application
    ├── launch_all.bat                   # 1-Click launcher starting both Backend & Frontend
    ├── README.md                        # Web app specific documentation
    │
    ├── backend/                         # FastAPI Python Backend
    │   ├── requirements.txt             # Python backend dependencies
    │   ├── run.py                       # Server entrypoint with custom sys.path prioritization
    │   ├── tests/                       # Unit and integration test suites
    │   │   ├── test_room_analyzer.py    # Unit tests for V2 components
    │   │   └── test_api_v2.py           # Integration & V1 regression test suite
    │   └── app/
    │       ├── __init__.py
    │       ├── config.py                # Pydantic Settings, dynamic paths & CORS configuration
    │       ├── main.py                  # FastAPI Application Factory with lifespan model preloader
    │       ├── core/
    │       │   ├── __init__.py
    │       │   ├── logger.py            # Production structured logging (sam3.server, sam3.model, sam3.api)
    │       │   ├── sam3_service.py      # Singleton managing model lifecycle, GPU cache & session state
    │       │   └── mask_engine.py       # High-performance alpha mask blending & BBox rendering
    │       ├── v2_room_analysis/        # SAM 3 V2 Autonomous Room Analysis Module
    │       │   ├── __init__.py
    │       │   ├── analyzer.py          # Master RoomAnalyzer orchestrator
    │       │   ├── detector.py          # Multi-concept prompt candidate extractor
    │       │   ├── mask_refiner.py      # Hierarchical subtraction, multi-wall plane splitting
    │       │   ├── region_classifier.py # Spatial priors & multi-signal confidence scoring
    │       │   ├── depth_estimator.py   # Perspective geometry & surface normal reasoning
    │       │   └── cache.py             # SHA-256 in-memory LRU image cache
    │       ├── schemas/
    │       │   ├── __init__.py
    │       │   ├── requests.py          # V1 Pydantic models for API validation
    │       │   └── room.py              # V2 Pydantic models for Room Analysis
    │       └── api/
    │           ├── router.py            # Root API router aggregation
    │           └── v1/
    │               ├── endpoints_health.py        # GET /api/v1/health & POST /api/v1/device/switch
    │               ├── endpoints_image.py         # POST /api/v1/set-image & POST /api/v1/reset
    │               ├── endpoints_segment_text.py  # POST /api/v1/segment-text
    │               ├── endpoints_segment_point.py # POST /api/v1/segment-points
    │               └── endpoints_room.py          # POST /api/v1/analyze-room (V2)
    │
    └── frontend/                        # Next.js 14 Modern Web UI
        ├── package.json                 # Node dependencies (Next.js, Tailwind, Lucide)
        ├── tailwind.config.js           # Theme extensions & responsive breakpoints
        ├── public/samples/              # High-res sample images (living_room, bedroom, kitchen)
        └── src/
            ├── app/
            │   ├── layout.js            # Root HTML layout & fonts
            │   ├── globals.css          # Dark slate theme & glassmorphism utilities
            │   ├── page.js              # V1 Full-width manual segmentation workspace
            │   └── room-analysis/       # V2 Dedicated Route
            │       └── page.js          # Autonomous Room Analysis single-screen workspace
            ├── components/
            │   ├── common/              # Shared Components (Header, DeviceSelector, Badge)
            │   │   ├── Header.js
            │   │   ├── DeviceSelector.js
            │   │   └── Badge.js
            │   ├── v1_manual/           # V1 Manual Prompting Components
            │   │   ├── canvas/          # InteractiveCanvas.js, CanvasControls.js
            │   │   ├── panels/          # ControlPanel.js
            │   │   └── metrics/         # StatusLogger.js
            │   └── v2_room_analysis/    # V2 Autonomous Room Analysis Components
            │       ├── RoomAnalysisWorkspace.js # 7/5 grid zero-scroll workspace
            │       ├── RoomImageViewer.js       # Composite overlay viewer with opacity slider
            │       ├── RegionList.js            # Interactive summary cards, filter tabs, batch toggles
            │       ├── RegionItem.js            # High-contrast surface card with icons & micro bars
            │       ├── AnalysisProgress.js      # Progressive pipeline status indicator
            │       └── RoomUpload.js            # Dropzone with visual sample home photo cards
            ├── hooks/
            │   ├── useBackendHealth.js  # 5s polling hook for API availability & device status
            │   ├── useSamSession.js     # V1 Session manager for image uploads, masks, points & undo
            │   └── useRoomAnalysis.js   # V2 State manager for room parsing & visible layers
            └── lib/
                ├── constants.js         # API endpoints & theme defaults
                └── api.js               # XMLHttpRequest client with real-time upload progress %
```

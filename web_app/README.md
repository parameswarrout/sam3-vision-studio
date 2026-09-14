# SAM 3 Vision Studio (Decoupled Full-Stack Suite)

A production-grade, modular, plug-and-play web application built with **Next.js (JavaScript)** for the frontend and **Python (FastAPI)** for the backend, powered by **Meta AI's SAM 3 (Segment Anything Model 3)**.

---

## 🏛️ Senior Architecture Overview

```
web_app/
├── backend/                  # Python FastAPI Backend
│   ├── app/
│   │   ├── config.py         # Strongly-typed settings & path detection
│   │   ├── core/             # sam3_service.py (AMP float16), session_manager.py, exceptions.py, logger.py
│   │   ├── services/         # Pure ML & Domain Services (room_analysis/, tile_engine/, generative/)
│   │   ├── db/               # Async SQLite WAL, models.py, repository.py, user_repository.py
│   │   ├── storage/          # Local disk storage driver with path traversal guards & atomic writes
│   │   ├── schemas/          # Pydantic request & response validators (v1, v2, v2.5, v3, v4, auth, admin)
│   │   ├── api/              # Versioned API Routers (v1/, v2/, v2_5/, v3/, v4/, router.py)
│   │   └── main.py           # FastAPI factory, timing middleware & global exception handlers
│   ├── requirements.txt
│   └── run.py                # Server runner
│
├── frontend/                 # Next.js (JavaScript + Tailwind CSS)
│   ├── src/
│   │   ├── app/              # Next.js App Router (layout, page, global css, v2, v2.5, v3, v4 routes)
│   │   ├── components/       # Reusable UI widgets (Canvas, Panels, Badges, Metrics, Studio)
│   │   ├── hooks/            # Custom React hooks (useSamSession, useTileVisualizerV3, useGenerativeStudio)
│   │   └── lib/              # Modular API client & constants
│   └── package.json
│
└── launch_all.bat            # 1-Click launcher for Windows
```

---

## 🚀 Quick Start Guide

### 1. Start the Backend (Python FastAPI)
In your active conda environment:
```bash
cd web_app/backend
python run.py
```
* Backend URL: `http://localhost:8000`
* Interactive Swagger API Docs: `http://localhost:8000/api/v1/docs`

### 2. Start the Frontend (Next.js)
In a new terminal:
```bash
cd web_app/frontend
npm install
npm run dev
```
* Open in browser: `http://localhost:3000`

---

## 🌟 Key Features & Capabilities

1. **Open-Vocabulary Text Prompt Grounding:**
   - Detect and segment any concept described by text with interactive confidence filtering.
2. **Interactive Point Click Segmentation:**
   - Real-time positive (+) and negative (-) click prompting directly on the image canvas.
   - Includes Undo and Clear controls.
3. **Hardware Acceleration Indicator:**
   - Auto-detects NVIDIA CUDA GPU vs CPU and displays real-time health and latency metrics.
4. **Export & Visual Controls:**
   - Instant export of segmented PNG outputs with alpha overlays and bounding box annotations.

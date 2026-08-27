# SAM 3 AI Generative Studio (V4.0) — CPU Latent Diffusion Inpainting Architecture

## 1. Executive Summary
The **SAM 3 AI Generative Diffusion Studio (V4.0)** brings deep generative visual AI to interior architecture and material design. It pairs **Meta's Segment Anything Model 3 (SAM 3)** high-precision segmentation masks with a **CPU-optimized Latent Diffusion Inpainting pipeline**, enabling photorealistic interior restyling, virtual staging, and architectural material synthesis entirely on **CPU RAM** without requiring expensive discrete GPU hardware.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              V4.0 CPU LATENT DIFFUSION INPAINTING PIPELINE                             │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  [ 1. Room Image & SAM 3 ]      [ 2. Prompt Architect ]        [ 3. 8-Thread CPU Diffusion ]     [ 4. Output ]
 ┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────────┐   ┌──────────────┐
 │ • Upload / Sample Room  │───►│ • 8 Interior Styles     │───►│ • DPM++ 2M SDE Karras       │──►│ 4K Ultra     │
 │ • SAM 3 Surface Mask    │    │ • Lighting & Raytracing │    │ • Low-Memory PyTorch Multi- │   │ Photoreal    │
 │ • Optional Full Scene   │    │ • Negative Defect Guard │    │   Threading (15–20 Steps)   │   │ Room Restyle │
 └─────────────────────────┘    └─────────────────────────┘    └─────────────────────────────┘   └──────────────┘
```

---

## 2. Dedicated V4 System Architecture

```text
e:\AI\Segmentation_model_by_meta\
├── web_app/
│   ├── backend/                         # FastAPI Python Server (Port 8000)
│   │   ├── app/
│   │   │   ├── api/v1/__init__.py       # Mounted routes (/api/v1/v4/generate/*)
│   │   │   ├── schemas/v4_generative.py # Pydantic Schemas for V4
│   │   │   └── v4_generative_diffusion/ # DEDICATED V4 BACKEND PACKAGE
│   │   │       ├── __init__.py          # Package exports
│   │   │       ├── router.py            # REST Endpoints: /presets, /status, /restyle-room
│   │   │       ├── diffusion_engine.py  # CPU-Optimized Inpainting Pipeline (Diffusers + PyTorch)
│   │   │       └── prompt_architect.py  # Architectural Prompt Builder & Negative Defect Guard
│   └── frontend/                        # Next.js 14 Web Studio (Port 3000)
│       └── src/
│           ├── app/v4-generative-studio/# Dedicated Next.js V4 Page Route
│           │   └── page.js
│           ├── components/
│           │   ├── common/Header.js     # Top Navigation with "AI Generative (V4.0)" Tab
│           │   └── v4_generative_studio/# DEDICATED V4 FRONTEND COMPONENTS
│           │       ├── GenerativeStudioWorkspace.js # Master Layout & Coordinator
│           │       ├── StylePresetGallery.js        # 8 Interior Architectural Style Cards
│           │       ├── PromptBuilderControls.js     # Denoising, Guidance, CPU Steps Controls
│           │       ├── GenerativeCanvasViewer.js    # Split Slider, Lightbox, HD Export
│           │       └── ComparisonSlider.js          # Before/After Interactive Comparison
│           ├── hooks/
│           │   └── useGenerativeStudio.js # Reactive V4 State Management Hook
│           └── lib/api.js               # V4 API Client Methods
```

---

## 3. Core Technical & Algorithmic Features

### A. CPU Multi-Threaded Latent Diffusion (`diffusion_engine.py`)
- **Engine**: `StableDiffusionInpaintPipeline` / `AutoPipelineForInpainting` with `DPMSolverMultistepScheduler` (Karras).
- **CPU Affinity**: Auto-detects available CPU physical cores and configures PyTorch multi-threading via `torch.set_num_threads(8)`.
- **Low-Memory Usage**: Employs `low_cpu_mem_usage=True` and attention slicing (`enable_attention_slicing(1)`) to run inside standard **8GB–16GB system RAM**.
- **Step Efficiency**: Uses 2nd-order SDE DPM++ solvers to reach photorealism in only **15–20 steps** (taking ~30–70 seconds on CPU).

---

### B. Architectural Prompt Architect (`prompt_architect.py`)
Provides 8 curated interior architectural styles with raytracing and photography enhancements:
1. 🌿 **Scandinavian Japandi**: Blonde oak timbers, wabi-sabi minimalist lines, morning sunlight.
2. 🏛️ **Italian Carrara Luxury Villa**: Polished Statuario marble, brushed brass, garden views.
3. 🏢 **Manhattan Industrial Loft**: Weathered red brick walls, dark distressed walnut, black steel fixtures.
4. 🏺 **Mediterranean Coastal Villa**: Burnt-orange terracotta tiles, whitewashed plaster, ocean light.
5. 🥖 **Parisian Haussmannian Classic**: Golden oak chevron parquet, ornate French wall boiserie.
6. 🖤 **Midnight Modern Penthouse**: Polished Nero Marquina black marble with lightning veins.
7. 🌴 **Balinese Tropical Modern**: Seamless cream terrazzo, slatted teak timber, courtyard skylights.
8. 💎 **Art Deco Emerald & Gold**: Glossy jewel emerald subway tiles, geometric brass inlay.

---

## 4. REST API Specification

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/v4/generate/presets` | `GET` | Returns 8 curated interior style presets with lighting metadata |
| `/api/v1/v4/generate/status` | `GET` | Returns CPU diffusion engine readiness and thread count |
| `/api/v1/v4/generate/restyle-room` | `POST` | Executes CPU Latent Diffusion Inpainting on active room photo |

---

## 5. Execution & Running Instructions

### 1. Start FastAPI Backend:
```powershell
.\venv_sam3\Scripts\Activate.ps1
cd web_app\backend
python .\run.py
```

### 2. Start Next.js Frontend:
```powershell
cd web_app\frontend
npm run dev
```

### 3. Open in Browser:
👉 Navigate to: **`http://localhost:3000/v4-generative-studio`** *(or click the "AI Generative V4.0" tab in the top navigation bar)*.

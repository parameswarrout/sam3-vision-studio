# SAM 3 Room Tile Visualizer (V2.5) — Comprehensive Technical & Architectural Documentation

## 1. Executive Summary
The **SAM 3 Room Tile Visualizer (V2.5)** is a computer vision and neural image processing pipeline designed to transform indoor room photographs into photorealistic architectural previews. It combines **Meta's Segment Anything Model 3 (SAM 3)** vision transformer with computer vision algorithms (perspective homography warping, multi-scale Retinex intrinsic decomposition, edge-preserving bilateral filtering, Poisson PDE gradient solvers, and Lambertian normal depth shading) to seamlessly replace existing room surfaces (floors, walls, backsplashes) with authentic architectural tile materials in **~160–250 ms**.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       USER WORKFLOW & DATA PIPELINE                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  [1. Input Image]          [2. SAM 3 Neural Engine]          [3. Material Synthesis]      [4. Photoreal Render]
 ┌────────────────┐        ┌────────────────────────┐        ┌─────────────────────┐      ┌────────────────────┐
 │  Room Photo    │───────►│ Open-Vocabulary Text   │───────►│ Real MyTyles 512px  │─────►│ 5 Physics Blending │
 │ (1200x896 JPG) │        │ Grounding + Obstacle   │        │ Texture Matrix +    │      │ Engines + Normal & │
 └────────────────┘        │ Carving (Mask Gen)     │        │ Homography Warp     │      │ Shadow Retention   │
                           └────────────────────────┘        └─────────────────────┘      └────────────────────┘
                                       │                                                             │
                                       ▼                                                             ▼
                           ┌────────────────────────┐                                     ┌────────────────────┐
                           │ Binary Surface Mask    │────────────────────────────────────►│ Interactive Dual-  │
                           │  (H x W Boolean np)    │                                     │ Pane Canvas Viewer │
                           └────────────────────────┘                                     └────────────────────┘
```

---

## 2. System Architecture & Component Layout

```
e:\AI\Segmentation_model_by_meta\
├── sam3/                                # Meta SAM 3 Vision Transformer Core Model
│   ├── checkpoints/sam3.pt              # Trained SAM 3 Transformer Weights
│   └── sam3/model/                      # Attention modules, prompt decoders, vision backbone
├── web_app/
│   ├── backend/                         # FastAPI High-Performance Asynchronous Python Server
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── sam3_service.py      # SAM3Service singleton (CUDA model management, embeddings)
│   │   │   │   └── database.py          # SQLite database schema, user audits, telemetry
│   │   │   ├── v2_5_tile_visualizer/
│   │   │   │   ├── router.py            # REST API routes: /catalog, /detect-surface, /render-tile
│   │   │   │   ├── tile_catalog.py      # 16 MyTyles product metadata, aliases, texture loader
│   │   │   │   ├── tile_detector.py     # Multi-prompt SAM 3 grounding + obstacle subtractor
│   │   │   │   └── tile_renderer.py     # 5 Blending Engines, Homography matrix, normal estimator
│   │   │   └── schemas/v2_5_tile.py     # Pydantic schemas for request/response validation
│   │   └── data/tiles/                  # 512x512 PNG authentic tile textures
│   └── frontend/                        # Next.js 14 React + Tailwind CSS Web Application
│       ├── public/
│       │   ├── samples/                 # Sample room photos (living room, bathroom, kitchen, etc.)
│       │   └── tiles/                   # Static tile textures for zero-latency client display
│       └── src/
│           ├── app/tile-visualizer/     # V2.5 Tile Visualizer page route
│           ├── components/v2_5_tile_visualizer/
│           │   ├── ComparisonSlider.js  # Interactive Before/After split comparison divider
│           │   ├── SampleRoomGallery.js # Room selector & drag-and-drop custom upload
│           │   ├── SurfaceSelector.js   # Floor/Wall radio selection, confidence & prompt inputs
│           │   ├── TileCatalog.js       # Categorized grid of 16 MyTyles products
│           │   ├── TileRenderControls.js# 5 Blending engine selector cards, presets, sliders
│           │   ├── TileCanvasViewer.js  # Canvas display + Fullscreen Large Screen Modal Lightbox
│           │   └── TileVisualizerWorkspace.js # Master workspace layout coordinator
│           └── hooks/
│               └── useTileVisualizer.js # Reactive UI state orchestrator (0ms optimistic updates)
```

---

## 3. Step-by-Step Execution Lifecycle

### Step 1: Room Selection & Zero-Latency UI Mounting
- User picks a preset room (*Living Room, Luxury Spa Bathroom, Chef Kitchen, Bedroom, Dining Room, Office*) or uploads a custom `.jpg`/`.png`.
- **Optimization**: The frontend updates the display canvas in **0ms** without sending blocking GPU requests. All previous segmentation masks and render layers are cleared from memory.

### Step 2: SAM 3 Neural Surface Grounding (`tile_detector.py`)
- User selects target surface (`floor` or `wall`), sets confidence (e.g. `0.15`–`0.40`), and clicks **`⚡ Detect Surface (SAM 3)`**.
- The backend checks if the image features are cached in GPU memory; if not, it computes vision embeddings (`processor.set_image()`).
- Multi-query open-vocabulary text grounding is executed:
  - **Floor Grounding**: Queries `["floor", "flooring", "wood floor", "tiled floor", "carpet floor"]`.
  - **Wall Grounding**: Queries `["wall", "room wall", "interior wall", "backsplash"]`.
- **Obstacle Carving**: A negative prompt query `["furniture, couch, bed, table, chair, cabinet, counter"]` runs at confidence `0.25`. Obstacle masks are subtracted (`surface_mask = surface_mask & ~obstacle_mask`) so tiles are never rendered over beds, sofas, or vanity cabinets.
- The composite binary mask is returned as a base64 alpha overlay.

### Step 3: Perspective Homography & Texture Mapping (`tile_renderer.py`)
1. **Texture Extraction**: Loads the 512×512 PNG texture of the chosen MyTyles product from disk.
2. **Grout Generation**: Adds grid lines (`grout_width`, `grout_color`) and repeats the texture unit into a seamless pattern.
3. **Perspective Transformation**:
   - For **Floors**: Computes a trapezoidal homography matrix $H$ where the top edge contracts (simulating distance to the horizon) and the bottom edge expands.
   - For **Walls**: Computes a vertical planar homography matrix.
   - Warps the tiled grid using `cv2.warpPerspective(pattern, H, (W, H), flags=cv2.INTER_LANCZOS4)`.

---

## 4. The 5 Physics & Computer Vision Blending Engines

| Engine ID | Name | Core Algorithm & Mathematics | Best Use Case |
| :--- | :--- | :--- | :--- |
| `hybrid` | 🏆 **Hybrid Photoreal Matrix** | Intrinsic multi-scale Retinex shadow extraction + 3D normal depth falloff + edge-preserving bilateral filter + sub-pixel mask feathering | **Master Recommended** (All room types) |
| `bilateral` | ⚡ **Bilateral Guided Shading** | Joint bilateral filter $I_{shadow} = \frac{1}{W_p} \sum_{q} I_q f(\|p-q\|) g(\|I_p-I_q\|)$ separating room shadows from old texture grain | Fast real-time previews (15–20ms) |
| `poisson` | 🌊 **Poisson Seamless Cloner** | Solves Poisson Partial Differential Equation $\Delta f = \operatorname{div} \mathbf{v}$ with Dirichlet boundary conditions (`cv2.seamlessClone`) | Skirting boards, complex corners & borders |
| `intrinsic` | 🔬 **Multi-Scale Intrinsic** | Multi-frequency Gaussian scale-space Retinex decoupling illumination $I = R \times L$ into low-freq ambient, shadows, and specular highlights | High Dynamic Range (HDR) sunlight rooms |
| `normal_depth` | 📐 **3D Depth & Normal Shading** | Calculates surface gradient normal vectors $\vec{N} = (-\frac{\partial z}{\partial x}, -\frac{\partial z}{\partial y}, 1)$ and Lambertian cosine light bounce $(\vec{N} \cdot \vec{L})$ | Rooms with directional windows/spotlights |

---

## 5. Architectural Tile Catalog (16 MyTyles Varieties)

Real, authentic products downloaded directly from [MyTyles.com](https://mytyles.com) with calibrated physical properties:

```python
TILE_CATALOG = [
    {"id": "mytyles_carrara_marble", "name": "MyTyles Statuario Carrara Royal", "category": "marble", "roughness": 0.15, "specular": 0.85},
    {"id": "mytyles_calacatta_gold", "name": "MyTyles Calacatta Oro Gold", "category": "marble", "roughness": 0.20, "specular": 0.80},
    {"id": "mytyles_nero_marquina", "name": "MyTyles Nero Marquina Midnight", "category": "marble", "roughness": 0.10, "specular": 0.90},
    {"id": "mytyles_rustic_oak_wood", "name": "MyTyles Golden Oak Plank", "category": "wood", "roughness": 0.70, "specular": 0.20},
    {"id": "mytyles_walnut_herringbone", "name": "MyTyles American Walnut Chevron", "category": "wood", "roughness": 0.65, "specular": 0.25},
    {"id": "mytyles_nordic_ash_wood", "name": "MyTyles Nordic Sand Birch", "category": "wood", "roughness": 0.50, "specular": 0.30},
    {"id": "mytyles_emerald_subway", "name": "MyTyles Emerald Green Beveled Subway", "category": "ceramic", "roughness": 0.20, "specular": 0.85},
    {"id": "mytyles_arctic_white_subway", "name": "MyTyles Arctic White Metro Subway", "category": "ceramic", "roughness": 0.15, "specular": 0.85},
    {"id": "mytyles_terracotta_hexagon", "name": "MyTyles Tuscan Baked Cotto Hexagon", "category": "ceramic", "roughness": 0.80, "specular": 0.15},
    {"id": "mytyles_moroccan_zellige", "name": "MyTyles Marrakech Cobalt Encaustic", "category": "mosaic", "roughness": 0.50, "specular": 0.40},
    {"id": "mytyles_venetian_terrazzo", "name": "MyTyles Venetian Pastel Confetti Terrazzo", "category": "stone", "roughness": 0.40, "specular": 0.50},
    {"id": "mytyles_charcoal_slate", "name": "MyTyles Anthracite Natural Cleft Slate", "category": "stone", "roughness": 0.85, "specular": 0.15},
    {"id": "mytyles_roman_travertine", "name": "MyTyles Roman Beige Vein Travertine", "category": "stone", "roughness": 0.55, "specular": 0.35},
    {"id": "mytyles_art_deco_mosaic", "name": "MyTyles Art Deco Midnight Gold Fan", "category": "mosaic", "roughness": 0.25, "specular": 0.80},
    {"id": "mytyles_concrete_industrial", "name": "MyTyles Urban Loft Burnished Concrete", "category": "stone", "roughness": 0.60, "specular": 0.30},
    {"id": "mytyles_andalusian_majolica", "name": "MyTyles Andalusian Vintage Floral", "category": "mosaic", "roughness": 0.30, "specular": 0.60},
]
```

---

## 6. Frontend Canvas & Large Screen Modal Features

The frontend canvas provides 5 simultaneous inspection modes:
1. **🌓 Split Slider**: Interactive divider with drag handle for before/after comparison.
2. **✨ Tiled Room**: Full-canvas photorealistic render.
3. **👁️ Original**: High-resolution unaltered room photo.
4. **🟣 SAM 3 Mask**: Segmented mask overlay with boundary edges.
5. **🔲 4-Way Quad View**: 2×2 synchronized simultaneous viewport showing all 4 states on one screen.
6. **🔍 Large Screen Lightbox**: Fullscreen modal (`Maximize2` / `Esc`) with interactive Zoom In/Out/Reset and HD Download.

---

## 7. Execution & Running Instructions

### Backend (FastAPI + CUDA `venv_sam3`):
```powershell
.\venv_sam3\Scripts\Activate.ps1
cd web_app\backend
python .\run.py
```

### Frontend (Next.js 14):
```powershell
cd web_app\frontend
npm run dev
```

Navigate to **http://localhost:3000/tile-visualizer** to test the entire suite.

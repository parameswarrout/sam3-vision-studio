# SAM 3 AI Generative Studio (V4.0) — Technical Architecture & CPU Latent Diffusion Specification

## 1. Executive Summary
The **SAM 3 AI Generative Studio (V4.0)** is an enterprise architectural vision system designed to perform **photorealistic interior redesign, virtual staging, and material inpainting directly on standard multi-core CPUs**. 

By pairing **Meta's Segment Anything Model 3 (SAM 3)** vision transformer with a **9-channel Latent Diffusion Inpainting UNet** and **DPM++ 2M SDE Karras 2nd-order solvers**, the system synthesizes realistic architectural materials, designer furniture, and raytraced daylight without requiring high-end discrete NVIDIA GPU hardware.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   V4.0 CPU LATENT DIFFUSION INPAINTING PIPELINE                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  [ 1. Input Room & SAM 3 ]      [ 2. Prompt Architect ]         [ 3. 8-Thread CPU Diffusion ]      [ 4. 4K Master Render ]
 ┌─────────────────────────┐    ┌──────────────────────────┐    ┌─────────────────────────────┐    ┌──────────────────────┐
 │ • Room Photo (Any Res)  │───►│ • 8 Curated Moodboards   │───►│ • 9-Channel Inpaint UNet    │───►│ • Sub-Pixel Blending │
 │ • SAM 3 Surface Mask    │    │ • Cinematic Raytracing   │    │ • DPM++ 2M SDE Karras       │    │ • Lanczos-4 Upscale  │
 │ • 7x7 Elliptical Dilate │    │ • Negative Defect Guard  │    │ • 8-Core PyTorch Threading  │    │ • Split Slider View  │
 └─────────────────────────┘    └──────────────────────────┘    └─────────────────────────────┘    └──────────────────────┘
```

---

## 2. Deep Dive: Models & Neural Architecture

### A. Primary Inpainting Model: `runwayml/stable-diffusion-inpainting`
The default engine uses the specialized **9-Channel Latent Diffusion Inpainting Model**:

| Component | Architecture | Parameter Count | Purpose |
| :--- | :--- | :---: | :--- |
| **Inpainting UNet** | 9-Channel Cross-Attention UNet | **~860 Million** | Denoises latent representation conditioned on text & room geometry |
| **Text Encoder** | CLIP ViT-L/14 | **~123 Million** | Encodes architectural style prompts into 768-dim semantic embeddings |
| **Autoencoder (VAE)** | AutoencoderKL (8× Spatial Downscale) | **~84 Million** | Compresses RGB pixels into 4-channel continuous latent space |
| **Fast Scheduler** | DPM++ 2M SDE (Karras Sigmas) | Algorithmic | 2nd-order differential equation solver (15–20 steps on CPU) |

#### Why the 9-Channel Inpaint UNet is Superior:
Standard diffusion models only take a 4-channel noisy latent image $z_t$. The specialized **Inpainting UNet** takes a concatenated **9-channel tensor** at every layer:
$$\mathbf{X}_{\text{in}} = \left[ z_t \,(4\text{ channels}) \;\|\; m_{\text{latent}} \,(1\text{ channel}) \;\|\; z_{\text{masked}} \,(4\text{ channels}) \right]$$
* **$z_t$ (4 channels)**: Current noisy latent state.
* **$m_{\text{latent}}$ (1 channel)**: Binary mask downscaled to match the latent grid ($H/8 \times W/8$).
* **$z_{\text{masked}}$ (4 channels)**: VAE latent representation of the unmasked room areas (walls, ceilings, windows).

**Result**: The AI has absolute mathematical awareness of the surrounding room context and will **never distort the unmasked ceiling, door frames, or windows**.

---

### B. Fallback Model: `stabilityai/stable-diffusion-2-inpainting`
If the primary model is unavailable, the pipeline falls back to Stable Diffusion 2.0 Inpainting using OpenCLIP ViT-H text embeddings with native 512px–768px spatial resolution.

---

## 3. CPU Optimization Mechanisms (Running on System RAM)

Running latent diffusion on CPU typically requires deep optimization to prevent memory saturation and excessive compute times:

### 1. PyTorch Multi-Core CPU Affinity
The engine dynamically detects physical CPU cores and configures PyTorch OpenMP/MKL multi-threading:
```python
num_cores = os.cpu_count() or 8
torch.set_num_threads(min(num_cores, 8))
```
This distributes the UNet matrix convolutions across all 8 CPU cores simultaneously.

### 2. Fast 2nd-Order DPM++ SDE Karras Scheduler
Standard DDIM or PNDM schedulers require **50 to 100 evaluation steps** to converge. The V4.0 engine replaces the scheduler with **DPM++ 2M SDE with Karras noise sigmas**:
* Reaches photorealism in only **15 to 20 steps**.
* **Reduces CPU computation time by ~65%** (~30–70 seconds on modern CPUs).

### 3. Sliced Cross-Attention & Memory Slicing
To prevent RAM exhaustion, attention matrices are computed sequentially in slices:
```python
pipe.enable_attention_slicing(1)
```
This allows the entire model pipeline to run comfortably inside standard **8GB to 16GB of System RAM**.

### 4. Aspect-Ratio Preserving Latent Downsampling & Lanczos-4 Upscaling
1. The input image is scaled to an optimal latent processing resolution (e.g. 768px width) where width and height are strictly divisible by 8:
   $$\text{target\_w} = \left(\left\lfloor \frac{768}{8} \right\rfloor\right) \times 8$$
2. After diffusion generation, the result is upscaled back to the original camera resolution using **Lanczos-4 sinc interpolation**, preserving sharp architectural edges.

---

## 4. SAM 3 Precision Mask Integration

The V4.0 engine integrates with SAM 3 through two distinct user-selectable modes:

```
                      ┌──────────────────────────────────────────────┐
                      │             SAM 3 GROUNDING INPUT            │
                      └──────────────────────────────────────────────┘
                                     │                │
             ┌───────────────────────┘                └────────────────────────┐
             ▼                                                                 ▼
 ┌──────────────────────────────────────┐                   ┌──────────────────────────────────────┐
 │    1. SAM 3 Surface-Only Inpaint     │                   │    2. Full-Scene Architectural Restyle│
 ├──────────────────────────────────────┤                   ├──────────────────────────────────────┤
 │ • Locks ceiling, windows & doors     │                   │ • Uses entire room photo as init     │
 │ • Restyles only floor/wall tiles     │                   │ • Generates matching furniture, rugs │
 │ • 7×7 elliptical boundary dilation   │                   │   and ambient lighting fixtures      │
 └──────────────────────────────────────┘                   └──────────────────────────────────────┘
```

---

## 5. Curated Architectural Prompt Library (8 Styles)

The `prompt_architect.py` engine translates style selections into prompt embeddings with photographic and lighting keywords:

```python
STYLE_PRESETS = [
    {
        "id": "japandi_minimalist",
        "name": "Scandinavian Japandi",
        "badge": "🌿 Japandi",
        "description": "Blonde Nordic oak timber, warm off-white linen textures, and soft morning daylight.",
        "lighting_style": "Soft warm morning diffuse daylight",
        "accent_color": "#10B981",
    },
    {
        "id": "italian_carrara_villa",
        "name": "Italian Carrara Luxury Villa",
        "badge": "🏛️ Royal Villa",
        "description": "High-gloss Statuario Carrara white marble, fluted brass accents, and Italian leather furniture.",
        "lighting_style": "Bright noon sun with crystal clear specular highlights",
        "accent_color": "#F59E0B",
    },
    {
        "id": "manhattan_loft",
        "name": "Manhattan Industrial Loft",
        "badge": "🏢 Soho Loft",
        "description": "Exposed warm red brick walls, burnished concrete, and distressed dark walnut flooring.",
        "lighting_style": "Warm amber Edison incandescent lighting",
        "accent_color": "#EF4444",
    },
    {
        "id": "mediterranean_coastal",
        "name": "Mediterranean Coastal Villa",
        "badge": "🏺 Tuscan Coast",
        "description": "Fired Tuscan terracotta tiles, whitewashed lime stucco walls, and rattan decor.",
        "lighting_style": "Dappled Mediterranean sunbeams",
        "accent_color": "#EA580C",
    },
    {
        "id": "parisian_haussmann",
        "name": "Parisian Haussmannian Classic",
        "badge": "🥖 Haussmann",
        "description": "French herringbone parquet flooring, ornate carved crown moldings, and French doors.",
        "lighting_style": "Romantic soft Parisian daylight",
        "accent_color": "#8B5CF6",
    },
    {
        "id": "midnight_modern_luxe",
        "name": "Midnight Modern Penthouse",
        "badge": "🖤 Dark Luxe",
        "description": "Nero Marquina black marble with white lightning veining and recessed bronze LED strips.",
        "lighting_style": "Moody ambient architectural spotlighting",
        "accent_color": "#6366F1",
    },
    {
        "id": "tropical_modern_resort",
        "name": "Balinese Tropical Modern",
        "badge": "🌴 Bali Modern",
        "description": "Seamless cream polished terrazzo floor, slatted teak timber, and courtyard skylights.",
        "lighting_style": "Lush tropical skylight sun rays",
        "accent_color": "#059669",
    },
    {
        "id": "art_deco_emerald_luxe",
        "name": "Art Deco Emerald & Gold",
        "badge": "💎 Art Deco",
        "description": "Glossy jewel emerald ceramic subway tiles, brass fan inlays, and Gatsby glamour.",
        "lighting_style": "Gleaming warm chandelier glow",
        "accent_color": "#EC4899",
    },
]
```

---

## 6. Local Storage & Offline Model Management

### Local Directory Path:
The model weights are saved and loaded directly from:
`web_app/backend/data/models/diffusion_inpaint/`

### Dedicated Downloader Script (`download_diffusion_model.py`):
To download and store the full model locally using your Hugging Face token:
```powershell
.\venv_sam3\Scripts\Activate.ps1
cd web_app\backend
python download_diffusion_model.py
```

### Loading Hierarchy:
1. **Local Check First**: If `web_app/backend/data/models/diffusion_inpaint/model_index.json` exists, the engine loads **100% offline from disk**.
2. **HF Token Cache**: If not found locally, it retrieves the user's Hugging Face token from `~/.cache/huggingface/token` and downloads automatically.

---

## 7. REST API Endpoints

### 1. `GET /api/v1/v4/generate/presets`
* **Response**: List of 8 architectural style presets with lighting and color metadata.

### 2. `GET /api/v1/v4/generate/status`
* **Response**: Engine readiness state, device (`cpu`), active thread count (`8`), and model ID.

### 3. `POST /api/v1/v4/generate/restyle-room`
* **Request Body**:
  ```json
  {
    "style_preset": "japandi_minimalist",
    "custom_prompt": "Add warm morning sunlight and a beige linen sofa",
    "negative_prompt": "blurry, artifacts, bad geometry",
    "strength": 0.75,
    "guidance_scale": 7.5,
    "num_inference_steps": 20,
    "seed": 42,
    "mask_mode": "surface_only"
  }
  ```
* **Response**:
  ```json
  {
    "success": true,
    "message": "Successfully generated photorealistic room restyle in 42.1s on CPU.",
    "style_preset": "japandi_minimalist",
    "prompt_used": "...",
    "generated_image_base64": "data:image/jpeg;base64,...",
    "execution_time_ms": 42100.0,
    "seed_used": 42,
    "steps_executed": 20
  }
  ```

---

## 8. Frontend User Experience (`/v4-generative-studio`)

The dedicated Next.js workspace provides:
* 🌓 **Draggable Split Slider**: Real-time Before/After comparison.
* 🖼️ **Fullscreen Lightbox**: High-resolution zoom inspection.
* 💾 **1-Click 4K Download**: Saves high-resolution JPEG render.
* 🎛️ **Denoising & Guidance Sliders**: Control creative freedom vs structural preservation.
* ⚡ **Telemetry Bar**: Displays CPU compute time and step telemetry.

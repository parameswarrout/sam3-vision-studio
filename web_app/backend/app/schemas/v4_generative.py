from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class StylePresetInfo(BaseModel):
    id: str
    name: str
    category: str
    badge: str
    description: str
    thumbnail_url: str
    prompt_keywords: str
    lighting_style: str
    accent_color: str

class GenerativeRestyleRequest(BaseModel):
    style_preset: str = Field("japandi_minimalist", description="Style preset ID or 'custom'")
    custom_prompt: Optional[str] = Field(None, description="Custom positive prompt describing desired room style")
    negative_prompt: Optional[str] = Field(None, description="Elements to avoid (e.g. clutter, artifacts)")
    strength: float = Field(0.75, ge=0.1, le=1.0, description="Denoising strength (higher = more drastic restyle)")
    guidance_scale: float = Field(7.5, ge=1.0, le=20.0, description="Classifier-Free Guidance prompt adherence")
    num_inference_steps: int = Field(20, ge=4, le=50, description="Diffusion steps (15-20 recommended for CPU)")
    seed: Optional[int] = Field(None, description="Random seed for reproducible generations")
    mask_mode: str = Field("surface_only", description="'surface_only' (tiles/floors/walls) or 'full_scene'")

class GenerativeRestyleResponse(BaseModel):
    success: bool
    message: str
    style_preset: str
    prompt_used: str
    negative_prompt_used: str
    generated_image_base64: str
    execution_time_ms: float
    seed_used: int
    steps_executed: int

class GenerativeStatusResponse(BaseModel):
    ready: bool
    model_name: str
    device: str
    num_threads: int
    styles_count: int

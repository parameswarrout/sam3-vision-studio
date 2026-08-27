"""
V4.0 AI Generative Diffusion Studio Package (CPU-Optimized with SAM 3).
"""
from app.v4_generative_diffusion.router import router as v4_generative_router
from app.v4_generative_diffusion.diffusion_engine import cpu_diffusion_engine
from app.v4_generative_diffusion.prompt_architect import prompt_architect, STYLE_PRESETS

__all__ = [
    "v4_generative_router",
    "cpu_diffusion_engine",
    "prompt_architect",
    "STYLE_PRESETS",
]

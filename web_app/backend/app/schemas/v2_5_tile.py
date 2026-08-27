from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class TileCatalogItem(BaseModel):
    id: str
    name: str
    category: str
    material: str
    finish: str
    color_tone: str
    description: str
    default_scale: float = 1.0
    aspect_ratio: str = "square"
    roughness: float = 0.5
    specular: float = 0.5
    grout_default_color: str = "#CBD5E1"
    grout_default_width: int = 2
    accent_color: str = "#6366F1"
    tag: Optional[str] = None
    thumbnail_url: Optional[str] = None

class SurfaceDetectRequest(BaseModel):
    surface_type: str = Field(..., description="'floor', 'wall', or 'both'")
    confidence: float = Field(0.12, ge=0.01, le=1.0, description="SAM 3 detection threshold")
    custom_prompt: Optional[str] = Field(None, description="Optional custom prompt, e.g. 'hardwood floor' or 'bathroom wall'")

class SurfaceMaskInfo(BaseModel):
    surface_type: str
    label: str
    area_ratio: float
    bbox: List[float]
    mask_base64: str
    color: str

class SurfaceDetectResponse(BaseModel):
    success: bool
    message: str
    surface_type: str
    num_regions: int
    surface_masks: List[SurfaceMaskInfo]
    composite_mask_base64: str
    execution_time_ms: float

class TileRenderRequest(BaseModel):
    tile_id: str = Field(..., description="ID of selected tile from catalog")
    surface_type: str = Field(..., description="'floor', 'wall', or 'both'")
    scale: float = Field(1.0, ge=0.2, le=3.0, description="Tiling density / scale factor")
    rotation_deg: float = Field(0.0, ge=-180.0, le=180.0, description="Tile rotation in degrees")
    perspective_strength: float = Field(0.65, ge=0.0, le=1.0, description="Perspective vanishing compression")
    shadow_retention: float = Field(0.75, ge=0.0, le=1.0, description="Original lighting & shadow blend strength")
    grout_width: int = Field(2, ge=0, le=10, description="Grout line width in pixels")
    grout_color: str = Field("#CBD5E1", description="Grout hex color code")
    glossiness: float = Field(0.5, ge=0.0, le=1.0, description="Specular surface reflection boost")
    blending_mode: str = Field("hybrid", description="Blending engine: 'hybrid', 'bilateral', 'poisson', 'intrinsic', 'normal_depth'")

class TileRenderResponse(BaseModel):
    success: bool
    message: str
    tile_id: str
    surface_type: str
    blending_mode: str = "hybrid"
    rendered_image_base64: str
    mask_overlay_base64: str
    execution_time_ms: float

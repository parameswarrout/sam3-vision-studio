from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class V5DetectSurfaceRequest(BaseModel):
    surface_type: str = Field("floor", description="Target surface type: 'floor', 'wall', or 'backsplash'")
    confidence: float = Field(0.15, ge=0.01, le=1.0, description="SAM 3 ensemble confidence threshold")
    custom_prompt: Optional[str] = Field(None, description="Optional custom grounding text prompt")
    image_base64: Optional[str] = Field(None, description="Optional raw base64 image data URI")
    points: Optional[List[List[float]]] = Field(None, description="Optional interactive prompt points [[x, y, label], ...]")

class V5DetectSurfaceResponse(BaseModel):
    surface_type: str
    num_regions: int
    composite_mask_base64: str
    alpha_matte_base64: str
    execution_time_ms: float

class V5RenderRequest(BaseModel):
    tile_id: str = Field("mytyles_carrara_marble", description="Unique catalog SKU identifier")
    surface_type: str = Field("floor", description="Target planar surface ('floor', 'wall', 'backsplash')")
    custom_prompt: Optional[str] = Field(None, description="Optional prompt override")
    image_base64: Optional[str] = Field(None, description="Optional raw base64 image data URI")
    points: Optional[List[List[float]]] = Field(None, description="Optional interactive prompt points [[x, y, label], ...]")
    scale: float = Field(1.0, ge=0.2, le=5.0, description="Tile physical metric scale multiplier")
    rotation_deg: float = Field(0.0, ge=-180.0, le=180.0, description="Tile rotation in degrees on the 3D plane")
    bump_strength: float = Field(1.0, ge=0.0, le=3.0, description="Cook-Torrance normal bump strength")
    grout_width_mm: float = Field(3.0, ge=0.0, le=15.0, description="Physical 3D grout width in millimeters")
    seam_blend_radius: int = Field(3, ge=1, le=10, description="Boundary seam blending pixel radius (3-5px)")
    confidence: float = Field(0.15, ge=0.01, le=1.0, description="SAM 3 detection confidence threshold")
    apply_geometric_feedback: bool = Field(True, description="Enable Stage 1 & 2 3D geometric consistency feedback filter")

class V5MetricsReport(BaseModel):
    boundary_f_score: float = Field(..., description="Boundary F-score (Target: >= 0.90)")
    mask_iou: float = Field(..., description="Surface IoU")
    plane_reprojection_error_pct: float = Field(..., description="Plane fit reprojection error % (Target: < 1.5%)")
    intrinsic_reconstruction_ssim: float = Field(..., description="Intrinsic Albedo x Shading SSIM (Target: >= 0.97)")
    unmasked_ssim: float = Field(..., description="Unmasked room SSIM (Target: >= 0.995)")
    unmasked_lpips: float = Field(..., description="Unmasked room LPIPS proxy (Target: <= 0.02)")
    quality_gates_passed: bool = Field(..., description="True if all 4 metric quality gates pass")

class V5RenderResponse(BaseModel):
    rendered_image_base64: str
    metrics: V5MetricsReport
    timings_ms: Dict[str, float]
    plane_equation: Dict[str, Any]
    light_parameters: Dict[str, Any]
    diagnostics: Dict[str, str]

class V5OfflineVariantRequest(BaseModel):
    sku_id: str = Field("mytyles_carrara_marble", description="Catalog SKU to generate variants for")
    num_variants: int = Field(4, ge=1, le=8, description="Number of variants to generate")
    qa_threshold: float = Field(0.85, ge=0.5, le=0.99, description="QA similarity acceptance gate threshold")

class V5OfflineVariantResponse(BaseModel):
    parent_sku: str
    total_generated: int
    total_approved: int
    variants: List[Dict[str, Any]]
    execution_time_ms: float

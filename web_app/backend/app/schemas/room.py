from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class QualityScores(BaseModel):
    semantic: float = Field(..., ge=0.0, le=1.0, description="Semantic confidence score")
    geometry: float = Field(..., ge=0.0, le=1.0, description="Planar & normal consistency score")
    boundary: float = Field(..., ge=0.0, le=1.0, description="Edge sharpness and boundary adherence score")

class RoomRegionItem(BaseModel):
    id: str = Field(..., description="Unique region identifier, e.g., 'wall_1', 'floor_1'")
    type: str = Field(..., description="Semantic category: 'wall', 'floor', 'ceiling', 'window', 'door', 'furniture'")
    label: str = Field(..., description="Human-readable display name, e.g., 'Left Wall', 'Floor Surface'")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Overall multi-signal confidence score")
    needs_review: bool = Field(False, description="Flagged true if confidence < 0.72 or boundary ambiguity exists")
    area_ratio: float = Field(..., ge=0.0, le=1.0, description="Fraction of total image area occupied")
    bbox: List[float] = Field(..., description="Bounding box [x1, y1, x2, y2] in pixels")
    color: str = Field(..., description="Hex or RGBA display color code for mask overlay")
    mask_base64: str = Field(..., description="Base64 encoded PNG mask overlay")
    depth_hint: Optional[str] = Field(None, description="Geometric plane classification: 'vertical_plane', 'ground_plane', 'ceiling_plane'")
    quality: QualityScores = Field(default_factory=lambda: QualityScores(semantic=0.90, geometry=0.90, boundary=0.90), description="Quality metrics breakdown")
    signals: Optional[Dict[str, float]] = Field(default=None, description="Debug raw scoring breakdown")

class RoomAnalysisMetadata(BaseModel):
    image_hash: str
    width: int
    height: int
    device: str
    wall_count: int
    floor_count: int
    window_count: int
    door_count: int
    furniture_count: int
    ceiling_count: int
    cached: bool = False
    depth_enabled: bool = True
    needs_review_count: int = 0
    pipeline_stages: Dict[str, float] = Field(default_factory=dict)

class RoomAnalysisResponse(BaseModel):
    success: bool
    message: str
    width: int
    height: int
    regions: List[RoomRegionItem]
    composite_overlay_base64: Optional[str] = None
    execution_time_ms: float
    metadata: RoomAnalysisMetadata

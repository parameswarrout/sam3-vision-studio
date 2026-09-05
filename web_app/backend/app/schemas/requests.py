from typing import List, Optional, Any
from pydantic import BaseModel, Field

class PointPromptItem(BaseModel):
    x: float = Field(..., description="Normalized X coordinate in range [0.0, 1.0]")
    y: float = Field(..., description="Normalized Y coordinate in range [0.0, 1.0]")
    label: int = Field(1, description="1 for positive point (+), 0 for negative point (-)")

class PointPromptRequest(BaseModel):
    points: List[PointPromptItem] = Field(..., description="List of interactive coordinate points")

class TextPromptRequest(BaseModel):
    prompt: str = Field(..., description="Text query / concept to ground, e.g., 'person', 'red sports car'")
    confidence: float = Field(0.70, ge=0.01, le=1.0, description="Confidence threshold for detection")

class DeviceSwitchRequest(BaseModel):
    device: str = Field(..., description="'cuda' or 'cpu'")
    checkpoint_path: Optional[str] = Field(None, description="Optional custom checkpoint file path")

class DeviceSwitchResponse(BaseModel):
    success: bool
    message: str
    device: str
    load_time_s: float
    cuda_available: bool

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float

class SegmentedRegionItem(BaseModel):
    index: int
    label: Optional[str] = None
    cutout_base64: Optional[str] = None
    cropped_base64: Optional[str] = None
    bbox: Optional[List[float]] = None

class SegmentationResponse(BaseModel):
    success: bool
    message: str
    num_objects: int
    image_base64: Optional[str] = None
    cutout_image_base64: Optional[str] = None
    cropped_cutout_base64: Optional[str] = None
    mask_only_base64: Optional[str] = None
    regions: Optional[List[SegmentedRegionItem]] = None
    boxes: Optional[List[List[float]]] = None
    labels: Optional[List[str]] = None
    execution_time_ms: float

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    checkpoint_path: str
    device: str
    cuda_available: bool
    version: str

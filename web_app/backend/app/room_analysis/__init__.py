"""
Backward-compatibility bridge: forwards to app.v2_room_analysis
"""
from app.v2_room_analysis import (
    room_analyzer,
    RoomAnalyzer,
    room_detector,
    RoomDetector,
    mask_refiner,
    MaskRefiner,
    region_classifier,
    RegionClassifier,
    depth_estimator,
    DepthEstimator,
    geometry_analyzer,
    GeometryAnalyzer,
    room_cache,
    RoomAnalysisCache,
)

__all__ = [
    "room_analyzer",
    "RoomAnalyzer",
    "room_detector",
    "RoomDetector",
    "mask_refiner",
    "MaskRefiner",
    "region_classifier",
    "RegionClassifier",
    "depth_estimator",
    "DepthEstimator",
    "geometry_analyzer",
    "GeometryAnalyzer",
    "room_cache",
    "RoomAnalysisCache",
]

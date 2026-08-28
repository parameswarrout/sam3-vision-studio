"""
Photorealistic Neural Perspective & PBR Room Tile Visualizer Service.
"""
from app.services.tile_engine.tile_catalog import (
    TILE_CATALOG,
    get_tile_by_id,
    generate_tile_texture,
    ensure_all_tile_textures,
)
from app.services.tile_engine.vanishing_point_estimator import (
    VanishingPointEstimator,
    vanishing_point_estimator,
)
from app.services.tile_engine.pbr_material_engine import (
    PBRMaterialEngine,
    pbr_material_engine,
)
from app.services.tile_engine.tile_detector import (
    SurfaceTileDetectorV3 as TileDetector,
    tile_detector_v3 as tile_detector,
)
from app.services.tile_engine.tile_renderer import (
    PerspectiveTileRendererV3 as TileRenderer,
    tile_renderer_v3 as tile_renderer,
)

__all__ = [
    "TILE_CATALOG",
    "get_tile_by_id",
    "generate_tile_texture",
    "ensure_all_tile_textures",
    "VanishingPointEstimator",
    "vanishing_point_estimator",
    "PBRMaterialEngine",
    "pbr_material_engine",
    "TileDetector",
    "tile_detector",
    "TileRenderer",
    "tile_renderer",
]

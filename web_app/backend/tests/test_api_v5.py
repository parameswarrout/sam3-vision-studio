import sys
from pathlib import Path
from fastapi.testclient import TestClient
import numpy as np
from PIL import Image

BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.main import app
from app.core import sam3_service

client = TestClient(app)

def test_v5_catalog_endpoint():
    """Tests GET /api/v1/v5/surface-replacement/catalog."""
    response = client.get("/api/v1/v5/surface-replacement/catalog")
    assert response.status_code == 200
    data = response.json()
    assert "catalog" in data
    assert len(data["catalog"]) > 0
    assert "total_skus" in data
    assert data["total_skus"] >= 5

def test_v5_render_replacement_endpoint():
    """Tests POST /api/v1/v5/surface-replacement/render-replacement."""
    # Set active image in sam3 session
    test_img = Image.new("RGB", (320, 240), color=(200, 180, 160))
    sam3_service.current_image = test_img

    payload = {
        "tile_id": "mytyles_carrara_marble",
        "surface_type": "floor",
        "scale": 1.0,
        "rotation_deg": 0.0,
        "bump_strength": 1.0,
        "grout_width_mm": 3.0,
        "seam_blend_radius": 3,
        "confidence": 0.15,
        "apply_geometric_feedback": True
    }

    response = client.post("/api/v1/v5/surface-replacement/render-replacement", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "rendered_image_base64" in data
    assert data["rendered_image_base64"].startswith("data:image/jpeg;base64,")
    assert "metrics" in data
    assert "boundary_f_score" in data["metrics"]
    assert "plane_reprojection_error_pct" in data["metrics"]
    assert "intrinsic_reconstruction_ssim" in data["metrics"]
    assert "unmasked_ssim" in data["metrics"]
    assert "plane_equation" in data
    assert "light_parameters" in data
    assert "diagnostics" in data
    assert "uv_grid_base64" in data["diagnostics"]
    assert "normal_map_base64" in data["diagnostics"]
    assert "shading_field_base64" in data["diagnostics"]
    assert "alpha_matte_base64" in data["diagnostics"]

def test_v5_offline_variant_generator_endpoint():
    """Tests POST /api/v1/v5/surface-replacement/offline-catalog-generator."""
    payload = {
        "sku_id": "mytyles_carrara_marble",
        "num_variants": 2,
        "qa_threshold": 0.80
    }
    response = client.post("/api/v1/v5/surface-replacement/offline-catalog-generator", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["parent_sku"] == "mytyles_carrara_marble"
    assert data["total_generated"] == 2
    assert len(data["variants"]) == 2

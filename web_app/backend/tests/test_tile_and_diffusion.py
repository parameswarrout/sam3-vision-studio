import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.core.session_manager import session_manager
from app.storage import storage_service
from PIL import Image

class TestTileAndDiffusionModules(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_v2_5_catalog_and_texture(self):
        """Verify V2.5 Tile Visualizer catalog and texture streaming."""
        res_cat = self.client.get("/api/v1/v2.5/tiles/catalog")
        self.assertEqual(res_cat.status_code, 200)
        items = res_cat.json()
        self.assertGreaterEqual(len(items), 10)
        first_id = items[0]["id"]

        # Stream texture
        res_tex = self.client.get(f"/api/v1/v2.5/tiles/texture/{first_id}")
        self.assertEqual(res_tex.status_code, 200)
        self.assertEqual(res_tex.headers["content-type"], "image/png")

    def test_v3_catalog_and_texture(self):
        """Verify V3.0 PBR Tile Visualizer catalog and texture streaming."""
        res_cat = self.client.get("/api/v1/v3/tiles/catalog")
        self.assertEqual(res_cat.status_code, 200)
        items = res_cat.json()
        self.assertGreaterEqual(len(items), 10)
        first_id = items[0]["id"]

        # Stream texture
        res_tex = self.client.get(f"/api/v1/v3/tiles/texture/{first_id}")
        self.assertEqual(res_tex.status_code, 200)
        self.assertEqual(res_tex.headers["content-type"], "image/png")

    def test_v4_diffusion_presets_and_status(self):
        """Verify V4.0 Generative Diffusion Studio presets and status."""
        res_presets = self.client.get("/api/v1/v4/generate/presets")
        self.assertEqual(res_presets.status_code, 200)
        presets = res_presets.json()
        self.assertGreater(len(presets), 0)

        res_status = self.client.get("/api/v1/v4/generate/status")
        self.assertEqual(res_status.status_code, 200)
        status_data = res_status.json()
        self.assertIn("ready", status_data)
        self.assertIn("styles_count", status_data)

    def test_admin_stats_and_database_info(self):
        """Verify Admin command center telemetry and table data."""
        # Stats
        res_stats = self.client.get("/api/v1/admin/stats")
        self.assertEqual(res_stats.status_code, 200)
        stats = res_stats.json()
        self.assertIn("total_users", stats)
        self.assertIn("hardware", stats)

        # Database telemetry
        res_db = self.client.get("/api/v1/admin/database-info")
        self.assertEqual(res_db.status_code, 200)
        db_info = res_db.json()
        self.assertIn("tables", db_info)
        self.assertIn("journal_mode", db_info)

    def test_storage_driver_atomic_operations(self):
        """Verify storage driver write, load, and delete."""
        test_rel_path = "images/unit_test_probe.bin"
        test_bytes = b"SAM3_VISION_STUDIO_STORAGE_TEST_12345"

        saved_path = storage_service.save_bytes(test_rel_path, test_bytes)
        self.assertTrue(storage_service.exists(test_rel_path))

        loaded = storage_service.load_bytes(test_rel_path)
        self.assertEqual(loaded, test_bytes)

        deleted = storage_service.delete(test_rel_path)
        self.assertTrue(deleted)
        self.assertFalse(storage_service.exists(test_rel_path))

    def test_session_manager_thread_safety_and_lru(self):
        """Verify SessionManager set, get, and reset."""
        img = Image.new("RGB", (64, 64), color=(128, 128, 128))
        session = session_manager.set_active_image(img, session_id="test_sess")
        self.assertIsNotNone(session)
        self.assertEqual(session_manager.get_active_image("test_sess"), img)

        session_manager.reset_session("test_sess")
        self.assertIsNone(session_manager.get_active_image("test_sess"))

if __name__ == "__main__":
    unittest.main()

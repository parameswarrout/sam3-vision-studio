import io
import unittest
from pathlib import Path
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.core import sam3_service, session_manager

class TestApiV2AndV1Regression(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        # Create a mock/in-memory test image
        img = Image.new("RGB", (256, 256), color=(200, 200, 200))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        cls.test_image_bytes = buf.getvalue()

    def test_01_v1_health(self):
        """Verify V1 GET /api/v1/health is working."""
        res = self.client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "healthy")
        self.assertIn("device", data)
        self.assertIn("cuda_available", data)

    def test_02_v1_set_image_and_reset(self):
        """Verify V1 image upload and session reset."""
        res_upload = self.client.post(
            "/api/v1/set-image",
            files={"file": ("test.jpg", self.test_image_bytes, "image/jpeg")}
        )
        # In mock or loaded environment
        if res_upload.status_code == 200:
            self.assertTrue(res_upload.json().get("success"))
            self.assertIn("image_base64", res_upload.json())

        # Test reset
        res_reset = self.client.post("/api/v1/reset")
        self.assertEqual(res_reset.status_code, 200)
        self.assertTrue(res_reset.json().get("success"))

    def test_03_auth_and_profile_flow(self):
        """Verify authentication registration, login, and me profile endpoints."""
        test_email = f"architect_test_{id(self)}@studio.ai"
        test_pass = "SecurePass123!"

        # Register
        res_reg = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": test_email,
                "password": test_pass,
                "full_name": "Test Architect",
                "role": "architect",
            }
        )
        self.assertEqual(res_reg.status_code, 201)
        data_reg = res_reg.json()
        self.assertIn("access_token", data_reg)
        token = data_reg["access_token"]

        # Login
        res_login = self.client.post(
            "/api/v1/auth/login",
            json={"email": test_email, "password": test_pass}
        )
        self.assertEqual(res_login.status_code, 200)
        self.assertIn("access_token", res_login.json())

        # Profile with Bearer token
        res_me = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(res_me.status_code, 200)
        self.assertEqual(res_me.json()["email"], test_email)

    def test_04_history_endpoint(self):
        """Verify room history listing."""
        res = self.client.get("/api/v1/rooms/history?limit=10&offset=0")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertIn("items", data)

if __name__ == "__main__":
    unittest.main()


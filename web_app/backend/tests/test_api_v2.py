import unittest
import requests
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"

def get_test_image_path():
    for p in ["../frontend/public/samples/test_image.jpg", "public/samples/test_image.jpg", "web_app/frontend/public/samples/test_image.jpg"]:
        path = Path(p)
        if path.exists():
            return path
    raise FileNotFoundError("test_image.jpg not found in samples")

class TestApiV2AndV1Regression(unittest.TestCase):

    def test_01_v1_health(self):
        """Verify V1 GET /api/v1/health is working."""
        res = requests.get(f"{BASE_URL}/api/v1/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "healthy")
        self.assertTrue(data.get("model_loaded"))
        self.assertIn("cuda_available", data)

    def test_02_v2_analyze_room_and_cache(self):
        """Verify V2 POST /api/v1/analyze-room and subsequent cache hit."""
        img_path = get_test_image_path()

        # 1. First Call: Compute and Cache
        with open(img_path, "rb") as f:
            res1 = requests.post(
                f"{BASE_URL}/api/v1/analyze-room",
                files={"file": ("test.jpg", f, "image/jpeg")}
            )

        self.assertEqual(res1.status_code, 200)
        data1 = res1.json()
        self.assertTrue(data1.get("success"))
        self.assertIn("regions", data1)
        self.assertIn("metadata", data1)
        self.assertGreater(len(data1["regions"]), 0)
        print(f"\n[Test V2 Analyze] Found {len(data1['regions'])} region(s) in {data1.get('execution_time_ms')}ms:")
        for r in data1["regions"]:
            print(f"  - {r['id']}: {r['type']} ({r['label']}) | Conf: {r['confidence']*100:.0f}% | Area: {r['area_ratio']*100:.1f}%")

        # 2. Second Call: Must hit cache instantly
        with open(img_path, "rb") as f:
            res2 = requests.post(
                f"{BASE_URL}/api/v1/analyze-room",
                files={"file": ("test.jpg", f, "image/jpeg")}
            )

        self.assertEqual(res2.status_code, 200)
        data2 = res2.json()
        self.assertTrue(data2["metadata"]["cached"])
        print(f"[Test V2 Cache] Instant cache hit confirmed: cached={data2['metadata']['cached']}")

    def test_03_v1_set_image_and_segment_text(self):
        """Verify V1 image upload and text segmentation still work."""
        img_path = get_test_image_path()
        with open(img_path, "rb") as f:
            res_upload = requests.post(
                f"{BASE_URL}/api/v1/set-image",
                files={"file": ("test.jpg", f, "image/jpeg")}
            )
        self.assertEqual(res_upload.status_code, 200)
        self.assertTrue(res_upload.json().get("success"))

        # Run text prompt
        res_text = requests.post(
            f"{BASE_URL}/api/v1/segment-text",
            json={"prompt": "wall", "confidence": 0.10}
        )
        self.assertEqual(res_text.status_code, 200)
        data_text = res_text.json()
        self.assertTrue(data_text.get("success"))
        print(f"[Test V1 Text Prompt] Success: num_objects={data_text.get('num_objects')}")

    def test_04_v1_segment_points(self):
        """Verify V1 interactive point prompt segmentation still works."""
        img_path = get_test_image_path()
        with open(img_path, "rb") as f:
            res_upload = requests.post(
                f"{BASE_URL}/api/v1/set-image",
                files={"file": ("test.jpg", f, "image/jpeg")}
            )
        self.assertEqual(res_upload.status_code, 200)

        res_point = requests.post(
            f"{BASE_URL}/api/v1/segment-points",
            json={"points": [{"x": 0.5, "y": 0.5, "label": 1}]}
        )
        self.assertEqual(res_point.status_code, 200)
        data_point = res_point.json()
        self.assertTrue(data_point.get("success"))
        print(f"[Test V1 Point Prompt] Success: num_objects={data_point.get('num_objects')}")

    def test_05_v1_reset(self):
        """Verify V1 session reset works."""
        res_reset = requests.post(f"{BASE_URL}/api/v1/reset")
        self.assertEqual(res_reset.status_code, 200)
        self.assertTrue(res_reset.json().get("success"))
        print("[Test V1 Reset] Success: session reset confirmed")

if __name__ == "__main__":
    unittest.main()

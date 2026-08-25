import unittest
import numpy as np
from PIL import Image

from app.v2_room_analysis.cache import RoomAnalysisCache
from app.v2_room_analysis.mask_refiner import MaskRefiner
from app.v2_room_analysis.region_classifier import RegionClassifier
from app.v2_room_analysis.depth_estimator import DepthEstimator
from app.v2_room_analysis.geometry_analyzer import GeometryAnalyzer
from app.schemas.room import RoomRegionItem, RoomAnalysisResponse, RoomAnalysisMetadata, QualityScores

class TestRoomAnalyzerComponents(unittest.TestCase):
    
    def test_cache_hashing_and_lru(self):
        cache = RoomAnalysisCache(max_entries=2)
        img1 = Image.new("RGB", (100, 100), color=(255, 0, 0))
        img2 = Image.new("RGB", (100, 100), color=(0, 255, 0))
        img3 = Image.new("RGB", (100, 100), color=(0, 0, 255))

        h1 = cache.compute_image_hash(img1)
        h2 = cache.compute_image_hash(img2)
        h3 = cache.compute_image_hash(img3)

        self.assertNotEqual(h1, h2)
        self.assertIsNone(cache.get(h1))

        cache.set(h1, {"test": 1})
        self.assertIsNotNone(cache.get(h1))

        cache.set(h2, {"test": 2})
        cache.set(h3, {"test": 3})
        self.assertIsNone(cache.get(h1))
        self.assertIsNotNone(cache.get(h2))
        self.assertIsNotNone(cache.get(h3))

    def test_mask_refiner_speckle_removal(self):
        refiner = MaskRefiner()
        mask = np.zeros((100, 100), dtype=bool)
        mask[10:50, 10:50] = True
        mask[80:82, 80:82] = True

        cleaned = refiner.remove_small_components(mask, min_area_ratio=0.005)
        self.assertTrue(np.any(cleaned[10:50, 10:50]))
        self.assertFalse(np.any(cleaned[80:82, 80:82]))

    def test_mask_refiner_confidence_aware_occlusion(self):
        refiner = MaskRefiner()
        wall_mask = np.zeros((100, 100), dtype=bool)
        wall_mask[0:60, 0:100] = True

        floor_mask = np.zeros((100, 100), dtype=bool)
        floor_mask[50:100, 0:100] = True

        # High confidence window (>= 0.68) should carve
        high_conf_win = [{"mask": np.zeros((100, 100), dtype=bool), "score": 0.90}]
        high_conf_win[0]["mask"][15:35, 20:40] = True

        # Low confidence noise (< 0.68) should NOT carve
        low_conf_obs = [{"mask": np.zeros((100, 100), dtype=bool), "score": 0.50}]
        low_conf_obs[0]["mask"][70:95, 30:70] = True

        refined_walls, refined_floor, _ = refiner.apply_confidence_aware_occlusion(
            wall_masks=[wall_mask],
            floor_mask=floor_mask,
            ceiling_mask=None,
            opening_candidates=high_conf_win,
            obstacle_candidates=low_conf_obs,
            min_carve_confidence=0.68,
        )

        # High-confidence window is carved out of wall
        self.assertFalse(np.any(refined_walls[0][15:35, 20:40]))
        # Low-confidence obstacle does NOT destroy floor
        self.assertTrue(np.any(refined_floor[70:95, 30:70]))

    def test_evidence_based_wall_separation(self):
        refiner = MaskRefiner()
        # Case A: 1 contiguous wall with NO seams -> 1 plane
        wall_single = np.zeros((100, 100), dtype=bool)
        wall_single[10:60, 10:90] = True
        planes_single = refiner.separate_wall_planes_with_evidence(wall_single, vertical_seams=[], img_w=100, img_h=100)
        self.assertEqual(len(planes_single), 1)
        self.assertEqual(planes_single[0]["label"], "Main Wall Plane")

        # Case B: Wall with vertical corner seam at x = 50 -> 2 planes
        planes_split = refiner.separate_wall_planes_with_evidence(wall_single, vertical_seams=[50], img_w=100, img_h=100)
        self.assertEqual(len(planes_split), 2)

    def test_geometry_analyzer_normals_and_orientation(self):
        depth_est = DepthEstimator()
        geom_ana = GeometryAnalyzer()
        img = Image.new("RGB", (100, 100))
        depth_map = depth_est.estimate_depth(img)
        self.assertEqual(depth_map.shape, (100, 100))

        normals = geom_ana.compute_surface_normals(depth_map)
        self.assertEqual(normals.shape, (100, 100, 3))

        # Floor mask in lower region
        floor_mask = np.zeros((100, 100), dtype=bool)
        floor_mask[60:100, 0:100] = True
        plane_info = geom_ana.classify_plane_orientation(floor_mask, normals, 100)
        self.assertEqual(plane_info["orientation"], "ground_plane")

    def test_region_classifier_evaluation_and_uncertainty(self):
        classifier = RegionClassifier()
        wall_mask = np.zeros((100, 100), dtype=bool)
        wall_mask[10:60, 0:100] = True

        geom_info = {"geometry_confidence": 0.90, "orientation": "vertical_plane"}
        
        # High confidence evaluation
        eval_high = classifier.evaluate_surface("wall", 0.95, wall_mask, geom_info, 100, 100)
        self.assertGreaterEqual(eval_high["confidence"], 0.75)
        self.assertFalse(eval_high["needs_review"])
        self.assertIsInstance(eval_high["quality"], QualityScores)

        # Low confidence / uncertain evaluation
        eval_low = classifier.evaluate_surface("wall", 0.40, wall_mask, {"geometry_confidence": 0.50}, 100, 100)
        self.assertTrue(eval_low["needs_review"])

    def test_room_response_schema_validation(self):
        quality = QualityScores(semantic=0.94, geometry=0.91, boundary=0.95)
        region = RoomRegionItem(
            id="wall_1",
            type="wall",
            label="Main Wall Plane",
            confidence=0.93,
            needs_review=False,
            area_ratio=0.35,
            bbox=[0.0, 10.0, 50.0, 60.0],
            color="#3b82f6",
            mask_base64="data:image/png;base64,mock",
            depth_hint="vertical_plane",
            quality=quality,
        )
        metadata = RoomAnalysisMetadata(
            image_hash="abc123hash",
            width=1920,
            height=1080,
            device="cuda",
            wall_count=1,
            floor_count=0,
            window_count=0,
            door_count=0,
            furniture_count=0,
            ceiling_count=0,
            depth_enabled=True,
            needs_review_count=0,
        )
        resp = RoomAnalysisResponse(
            success=True,
            message="Test OK",
            width=1920,
            height=1080,
            regions=[region],
            execution_time_ms=150.0,
            metadata=metadata,
        )
        self.assertTrue(resp.success)
        self.assertEqual(len(resp.regions), 1)
        self.assertFalse(resp.regions[0].needs_review)

if __name__ == "__main__":
    unittest.main()

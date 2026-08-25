import time
import numpy as np
from typing import Dict, Any, List, Optional
from PIL import Image

from app.core import sam3_service, MaskEngine, api_logger
from app.schemas.room import RoomRegionItem, RoomAnalysisResponse, RoomAnalysisMetadata
from app.room_analysis.cache import room_cache
from app.room_analysis.detector import room_detector
from app.room_analysis.mask_refiner import mask_refiner
from app.room_analysis.region_classifier import region_classifier
from app.room_analysis.depth_estimator import depth_estimator

class RoomAnalyzer:
    """
    Master Orchestrator for SAM 3 V2 Automatic Room Scene & Surface Understanding.
    Produces high-precision structural masks for Walls, Floor, Ceiling, Openings, and Furniture.
    """

    def __init__(self):
        self.cache = room_cache
        self.detector = room_detector
        self.refiner = mask_refiner
        self.classifier = region_classifier
        self.depth = depth_estimator

    def analyze(self, image: Image.Image) -> RoomAnalysisResponse:
        """
        Executes end-to-end room parsing pipeline on an input PIL Image.
        """
        t_total_start = time.time()
        img_w, img_h = image.size
        
        # 1. Image Hash & LRU Cache Check
        image_hash = self.cache.compute_image_hash(image)
        cached_result = self.cache.get(image_hash)
        if cached_result is not None:
            cached_resp = RoomAnalysisResponse(**cached_result)
            cached_resp.metadata.cached = True
            return cached_resp

        api_logger.info(f"[RoomAnalyzer] Starting room analysis for image ({img_w}x{img_h}px, hash={image_hash[:10]}...)")
        timings = {}

        # 2. Extract Semantic Candidate Masks
        t0 = time.time()
        det_result = self.detector.extract_candidates(image)
        raw_candidates = det_result["candidates"]
        timings["candidate_extraction_ms"] = round((time.time() - t0) * 1000, 1)

        # 3. Aggregate Primary Category Masks
        t0 = time.time()
        # Combine all opening masks (windows + doors)
        opening_masks = [c["mask"] for c in raw_candidates["window"] + raw_candidates["door"]]
        # Combine all furniture masks
        obstacle_masks = [c["mask"] for c in raw_candidates["furniture"]]

        # Merge raw floor candidates into a unified floor mask
        raw_floor = np.zeros((img_h, img_w), dtype=bool)
        for fc in raw_candidates["floor"]:
            raw_floor |= fc["mask"]

        # Merge raw ceiling candidates
        raw_ceiling = np.zeros((img_h, img_w), dtype=bool)
        for cc in raw_candidates["ceiling"]:
            raw_ceiling |= cc["mask"]

        # Merge raw wall candidates
        raw_walls_combined = np.zeros((img_h, img_w), dtype=bool)
        for wc in raw_candidates["wall"]:
            raw_walls_combined |= wc["mask"]

        # 4. Multi-Wall Plane Disambiguation (Separate into Left, Center, Right wall facets)
        wall_planes = self.refiner.separate_wall_planes(raw_walls_combined, img_w, img_h)
        wall_plane_masks = [p["mask"] for p in wall_planes]

        # 5. Hierarchical Topological Refinement
        refined_walls, refined_floor, refined_ceiling = self.refiner.apply_hierarchical_subtraction(
            wall_masks=wall_plane_masks,
            floor_mask=raw_floor if np.any(raw_floor) else None,
            ceiling_mask=raw_ceiling if np.any(raw_ceiling) else None,
            opening_masks=opening_masks,
            obstacle_masks=obstacle_masks,
        )
        timings["mask_refinement_ms"] = round((time.time() - t0) * 1000, 1)

        # 6. Build Final Region Items List
        t0 = time.time()
        regions: List[RoomRegionItem] = []
        wall_idx = 1

        # A. Walls (Highest Priority)
        for idx, w_mask in enumerate(refined_walls):
            if not np.any(w_mask):
                continue
            area_r = round(float(np.sum(w_mask)) / (img_w * img_h), 4)
            if area_r < 0.015:
                continue

            y_idx, x_idx = np.where(w_mask)
            bbox = [float(np.min(x_idx)), float(np.min(y_idx)), float(np.max(x_idx)), float(np.max(y_idx))]
            conf = self.classifier.calculate_confidence("wall", 0.92, w_mask, img_w, img_h)
            color = self.classifier.get_color_for_region("wall", wall_idx - 1)
            
            # Position label
            sub_label = wall_planes[idx]["sub_label"] if idx < len(wall_planes) else f"Wall {wall_idx}"
            mask_b64 = self.refiner.mask_to_png_base64(w_mask, color_hex=color)

            regions.append(RoomRegionItem(
                id=f"wall_{wall_idx}",
                type="wall",
                label=sub_label,
                confidence=conf,
                area_ratio=area_r,
                bbox=bbox,
                color=color,
                mask_base64=mask_b64,
                depth_hint="vertical_plane",
            ))
            wall_idx += 1

        # B. Floor (Highest Priority)
        if refined_floor is not None and np.any(refined_floor):
            area_r = round(float(np.sum(refined_floor)) / (img_w * img_h), 4)
            if area_r >= 0.02:
                y_idx, x_idx = np.where(refined_floor)
                bbox = [float(np.min(x_idx)), float(np.min(y_idx)), float(np.max(x_idx)), float(np.max(y_idx))]
                conf = self.classifier.calculate_confidence("floor", 0.94, refined_floor, img_w, img_h)
                color = self.classifier.get_color_for_region("floor", 0)
                mask_b64 = self.refiner.mask_to_png_base64(refined_floor, color_hex=color)

                regions.append(RoomRegionItem(
                    id="floor_1",
                    type="floor",
                    label="Floor Surface",
                    confidence=conf,
                    area_ratio=area_r,
                    bbox=bbox,
                    color=color,
                    mask_base64=mask_b64,
                    depth_hint="ground_plane",
                ))

        # C. Ceiling
        if refined_ceiling is not None and np.any(refined_ceiling):
            area_r = round(float(np.sum(refined_ceiling)) / (img_w * img_h), 4)
            if area_r >= 0.02:
                y_idx, x_idx = np.where(refined_ceiling)
                bbox = [float(np.min(x_idx)), float(np.min(y_idx)), float(np.max(x_idx)), float(np.max(y_idx))]
                conf = self.classifier.calculate_confidence("ceiling", 0.88, refined_ceiling, img_w, img_h)
                color = self.classifier.get_color_for_region("ceiling", 0)
                mask_b64 = self.refiner.mask_to_png_base64(refined_ceiling, color_hex=color)

                regions.append(RoomRegionItem(
                    id="ceiling_1",
                    type="ceiling",
                    label="Ceiling Plane",
                    confidence=conf,
                    area_ratio=area_r,
                    bbox=bbox,
                    color=color,
                    mask_base64=mask_b64,
                    depth_hint="ceiling_plane",
                ))

        # D. Windows
        win_idx = 1
        for wc in raw_candidates["window"]:
            m = wc["mask"]
            if np.any(m):
                area_r = round(float(np.sum(m)) / (img_w * img_h), 4)
                if area_r >= 0.005:
                    y_idx, x_idx = np.where(m)
                    bbox = [float(np.min(x_idx)), float(np.min(y_idx)), float(np.max(x_idx)), float(np.max(y_idx))]
                    conf = self.classifier.calculate_confidence("window", wc["score"], m, img_w, img_h)
                    color = self.classifier.get_color_for_region("window", win_idx - 1)
                    mask_b64 = self.refiner.mask_to_png_base64(m, color_hex=color)

                    regions.append(RoomRegionItem(
                        id=f"window_{win_idx}",
                        type="window",
                        label=f"Window {win_idx}",
                        confidence=conf,
                        area_ratio=area_r,
                        bbox=bbox,
                        color=color,
                        mask_base64=mask_b64,
                        depth_hint="vertical_plane",
                    ))
                    win_idx += 1

        # E. Doors
        door_idx = 1
        for dc in raw_candidates["door"]:
            m = dc["mask"]
            if np.any(m):
                area_r = round(float(np.sum(m)) / (img_w * img_h), 4)
                if area_r >= 0.01:
                    y_idx, x_idx = np.where(m)
                    bbox = [float(np.min(x_idx)), float(np.min(y_idx)), float(np.max(x_idx)), float(np.max(y_idx))]
                    conf = self.classifier.calculate_confidence("door", dc["score"], m, img_w, img_h)
                    color = self.classifier.get_color_for_region("door", door_idx - 1)
                    mask_b64 = self.refiner.mask_to_png_base64(m, color_hex=color)

                    regions.append(RoomRegionItem(
                        id=f"door_{door_idx}",
                        type="door",
                        label=f"Door {door_idx}",
                        confidence=conf,
                        area_ratio=area_r,
                        bbox=bbox,
                        color=color,
                        mask_base64=mask_b64,
                        depth_hint="vertical_plane",
                    ))
                    door_idx += 1

        # F. Furniture / Occlusions
        furn_idx = 1
        for fc in raw_candidates["furniture"]:
            m = fc["mask"]
            if np.any(m):
                area_r = round(float(np.sum(m)) / (img_w * img_h), 4)
                if area_r >= 0.01:
                    y_idx, x_idx = np.where(m)
                    bbox = [float(np.min(x_idx)), float(np.min(y_idx)), float(np.max(x_idx)), float(np.max(y_idx))]
                    conf = self.classifier.calculate_confidence("furniture", fc["score"], m, img_w, img_h)
                    color = self.classifier.get_color_for_region("furniture", furn_idx - 1)
                    mask_b64 = self.refiner.mask_to_png_base64(m, color_hex=color)

                    regions.append(RoomRegionItem(
                        id=f"furniture_{furn_idx}",
                        type="furniture",
                        label=f"Furniture {furn_idx}",
                        confidence=conf,
                        area_ratio=area_r,
                        bbox=bbox,
                        color=color,
                        mask_base64=mask_b64,
                        depth_hint="ground_plane",
                    ))
                    furn_idx += 1

        timings["region_building_ms"] = round((time.time() - t0) * 1000, 1)
        total_time_ms = round((time.time() - t_total_start) * 1000, 1)

        # Category Counts
        wall_count = sum(1 for r in regions if r.type == "wall")
        floor_count = sum(1 for r in regions if r.type == "floor")
        window_count = sum(1 for r in regions if r.type == "window")
        door_count = sum(1 for r in regions if r.type == "door")
        furniture_count = sum(1 for r in regions if r.type == "furniture")
        ceiling_count = sum(1 for r in regions if r.type == "ceiling")

        metadata = RoomAnalysisMetadata(
            image_hash=image_hash,
            width=img_w,
            height=img_h,
            device=sam3_service.device,
            wall_count=wall_count,
            floor_count=floor_count,
            window_count=window_count,
            door_count=door_count,
            furniture_count=furniture_count,
            ceiling_count=ceiling_count,
            cached=False,
            pipeline_stages=timings,
        )

        response = RoomAnalysisResponse(
            success=True,
            message=f"Room analysis completed: found {wall_count} wall(s), {floor_count} floor, {window_count} window(s), {door_count} door(s), {furniture_count} furniture object(s).",
            width=img_w,
            height=img_h,
            regions=regions,
            composite_overlay_base64=None,
            execution_time_ms=total_time_ms,
            metadata=metadata,
        )

        # Store in cache
        self.cache.set(image_hash, response.dict())
        api_logger.info(f"[RoomAnalyzer] Completed in {total_time_ms}ms with {len(regions)} semantic regions.")
        return response

# Global analyzer instance
room_analyzer = RoomAnalyzer()

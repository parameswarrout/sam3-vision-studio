import time
import numpy as np
from typing import Dict, Any, List, Optional
from PIL import Image

from app.core import sam3_service, MaskEngine, api_logger
from app.schemas.room import RoomRegionItem, RoomAnalysisResponse, RoomAnalysisMetadata, QualityScores
from app.services.room_analysis.cache import room_cache
from app.services.room_analysis.detector import room_detector
from app.services.room_analysis.depth_estimator import depth_estimator
from app.services.room_analysis.geometry_analyzer import geometry_analyzer
from app.services.room_analysis.mask_refiner import mask_refiner
from app.services.room_analysis.region_classifier import region_classifier

class RoomAnalyzer:
    """
    Master Architecture Orchestrator for SAM 3 V2 Autonomous Room Scene Understanding.
    Focuses on maximum reliability and boundary quality for Wall and Floor surfaces.
    """

    def __init__(self):
        self.cache = room_cache
        self.detector = room_detector
        self.depth = depth_estimator
        self.geometry = geometry_analyzer
        self.refiner = mask_refiner
        self.classifier = region_classifier

    def analyze(self, image: Image.Image) -> RoomAnalysisResponse:
        """
        Executes end-to-end multi-signal room parsing pipeline on an input PIL Image.
        """
        t_total_start = time.time()
        img_w, img_h = image.size
        
        # 1. SHA-256 Image Hash & Cache Check
        image_hash = self.cache.compute_image_hash(image)
        cached_result = self.cache.get(image_hash)
        if cached_result is not None:
            cached_resp = RoomAnalysisResponse(**cached_result)
            cached_resp.metadata.cached = True
            return cached_resp

        api_logger.info(f"[RoomAnalyzer V2] Starting analysis ({img_w}x{img_h}px, hash={image_hash[:10]}...)")
        timings = {}

        # 2. Depth Map & Normal Field Computation
        t0 = time.time()
        depth_map = self.depth.estimate_depth(image)
        normals = self.geometry.compute_surface_normals(depth_map)
        vertical_seams = self.geometry.detect_vertical_seams(image, depth_map)
        timings["depth_and_geometry_ms"] = round((time.time() - t0) * 1000, 1)

        # 3. Candidate Extraction via SAM 3 Backbone
        t0 = time.time()
        det_result = self.detector.extract_candidates(image)
        raw_candidates = det_result["candidates"]
        timings["candidate_extraction_ms"] = round((time.time() - t0) * 1000, 1)

        # 4. Aggregate Candidate Masks
        t0 = time.time()
        raw_floor = np.zeros((img_h, img_w), dtype=bool)
        for fc in raw_candidates["floor"]:
            raw_floor |= fc["mask"]

        raw_ceiling = np.zeros((img_h, img_w), dtype=bool)
        for cc in raw_candidates["ceiling"]:
            raw_ceiling |= cc["mask"]

        raw_walls = np.zeros((img_h, img_w), dtype=bool)
        for wc in raw_candidates["wall"]:
            raw_walls |= wc["mask"]

        # 5. Evidence-Based Multi-Wall Disambiguation
        wall_planes = self.refiner.separate_wall_planes_with_evidence(
            raw_wall_mask=raw_walls,
            vertical_seams=vertical_seams,
            img_w=img_w,
            img_h=img_h
        )
        wall_plane_masks = [p["mask"] for p in wall_planes]

        # 6. Confidence-Aware Hierarchical Carving
        opening_candidates = raw_candidates["window"] + raw_candidates["door"]
        obstacle_candidates = raw_candidates["furniture"]

        refined_walls, refined_floor, refined_ceiling = self.refiner.apply_confidence_aware_occlusion(
            wall_masks=wall_plane_masks,
            floor_mask=raw_floor if np.any(raw_floor) else None,
            ceiling_mask=raw_ceiling if np.any(raw_ceiling) else None,
            opening_candidates=opening_candidates,
            obstacle_candidates=obstacle_candidates,
            min_carve_confidence=0.68,
            rgb_image=image,
        )
        timings["mask_refinement_ms"] = round((time.time() - t0) * 1000, 1)

        # 7. Multi-Signal Quality Evaluation & Region Building
        t0 = time.time()
        regions: List[RoomRegionItem] = []
        needs_review_count = 0

        # A. Wall Planes (Highest Priority)
        for idx, w_mask in enumerate(refined_walls):
            if not np.any(w_mask):
                continue
            area_r = round(float(np.sum(w_mask)) / (img_w * img_h), 4)
            if area_r < 0.015:
                continue

            y_idx, x_idx = np.where(w_mask)
            bbox = [float(np.min(x_idx)), float(np.min(y_idx)), float(np.max(x_idx)), float(np.max(y_idx))]
            geom_info = self.geometry.classify_plane_orientation(w_mask, normals, img_h)
            eval_result = self.classifier.evaluate_surface(
                region_type="wall",
                sam_score=0.92,
                mask=w_mask,
                geometry_info=geom_info,
                img_w=img_w,
                img_h=img_h,
            )

            if eval_result["needs_review"]:
                needs_review_count += 1

            color = self.classifier.get_color_for_region("wall", idx)
            label = wall_planes[idx]["label"] if idx < len(wall_planes) else f"Wall Plane {idx + 1}"
            mask_b64 = self.refiner.mask_to_png_base64(w_mask, color_hex=color)

            regions.append(RoomRegionItem(
                id=f"wall_{idx + 1}",
                type="wall",
                label=label,
                confidence=eval_result["confidence"],
                needs_review=eval_result["needs_review"],
                area_ratio=area_r,
                bbox=bbox,
                color=color,
                mask_base64=mask_b64,
                depth_hint=geom_info["orientation"],
                quality=eval_result["quality"],
                signals=eval_result["signals"],
            ))

        # B. Floor Surface (Highest Priority)
        if refined_floor is not None and np.any(refined_floor):
            area_r = round(float(np.sum(refined_floor)) / (img_w * img_h), 4)
            if area_r >= 0.02:
                y_idx, x_idx = np.where(refined_floor)
                bbox = [float(np.min(x_idx)), float(np.min(y_idx)), float(np.max(x_idx)), float(np.max(y_idx))]
                geom_info = self.geometry.classify_plane_orientation(refined_floor, normals, img_h)
                eval_result = self.classifier.evaluate_surface(
                    region_type="floor",
                    sam_score=0.94,
                    mask=refined_floor,
                    geometry_info=geom_info,
                    img_w=img_w,
                    img_h=img_h,
                )

                if eval_result["needs_review"]:
                    needs_review_count += 1

                color = self.classifier.get_color_for_region("floor", 0)
                mask_b64 = self.refiner.mask_to_png_base64(refined_floor, color_hex=color)

                regions.append(RoomRegionItem(
                    id="floor_1",
                    type="floor",
                    label="Floor Surface",
                    confidence=eval_result["confidence"],
                    needs_review=eval_result["needs_review"],
                    area_ratio=area_r,
                    bbox=bbox,
                    color=color,
                    mask_base64=mask_b64,
                    depth_hint=geom_info["orientation"],
                    quality=eval_result["quality"],
                    signals=eval_result["signals"],
                ))

        # C. Ceiling
        if refined_ceiling is not None and np.any(refined_ceiling):
            area_r = round(float(np.sum(refined_ceiling)) / (img_w * img_h), 4)
            if area_r >= 0.02:
                y_idx, x_idx = np.where(refined_ceiling)
                bbox = [float(np.min(x_idx)), float(np.min(y_idx)), float(np.max(x_idx)), float(np.max(y_idx))]
                geom_info = self.geometry.classify_plane_orientation(refined_ceiling, normals, img_h)
                eval_result = self.classifier.evaluate_surface(
                    region_type="ceiling",
                    sam_score=0.88,
                    mask=refined_ceiling,
                    geometry_info=geom_info,
                    img_w=img_w,
                    img_h=img_h,
                )
                if eval_result["needs_review"]:
                    needs_review_count += 1

                color = self.classifier.get_color_for_region("ceiling", 0)
                mask_b64 = self.refiner.mask_to_png_base64(refined_ceiling, color_hex=color)

                regions.append(RoomRegionItem(
                    id="ceiling_1",
                    type="ceiling",
                    label="Ceiling Plane",
                    confidence=eval_result["confidence"],
                    needs_review=eval_result["needs_review"],
                    area_ratio=area_r,
                    bbox=bbox,
                    color=color,
                    mask_base64=mask_b64,
                    depth_hint=geom_info["orientation"],
                    quality=eval_result["quality"],
                    signals=eval_result["signals"],
                ))

        # D. Openings (Windows)
        win_idx = 1
        for wc in raw_candidates["window"]:
            m = wc["mask"]
            if np.any(m):
                area_r = round(float(np.sum(m)) / (img_w * img_h), 4)
                if area_r >= 0.005:
                    y_idx, x_idx = np.where(m)
                    bbox = [float(np.min(x_idx)), float(np.min(y_idx)), float(np.max(x_idx)), float(np.max(y_idx))]
                    geom_info = self.geometry.classify_plane_orientation(m, normals, img_h)
                    eval_result = self.classifier.evaluate_surface("window", wc["score"], m, geom_info, img_w, img_h)
                    if eval_result["needs_review"]:
                        needs_review_count += 1

                    color = self.classifier.get_color_for_region("window", win_idx - 1)
                    mask_b64 = self.refiner.mask_to_png_base64(m, color_hex=color)

                    regions.append(RoomRegionItem(
                        id=f"window_{win_idx}",
                        type="window",
                        label=f"Window {win_idx}",
                        confidence=eval_result["confidence"],
                        needs_review=eval_result["needs_review"],
                        area_ratio=area_r,
                        bbox=bbox,
                        color=color,
                        mask_base64=mask_b64,
                        depth_hint=geom_info["orientation"],
                        quality=eval_result["quality"],
                        signals=eval_result["signals"],
                    ))
                    win_idx += 1

        # E. Openings (Doors)
        door_idx = 1
        for dc in raw_candidates["door"]:
            m = dc["mask"]
            if np.any(m):
                area_r = round(float(np.sum(m)) / (img_w * img_h), 4)
                if area_r >= 0.01:
                    y_idx, x_idx = np.where(m)
                    bbox = [float(np.min(x_idx)), float(np.min(y_idx)), float(np.max(x_idx)), float(np.max(y_idx))]
                    geom_info = self.geometry.classify_plane_orientation(m, normals, img_h)
                    eval_result = self.classifier.evaluate_surface("door", dc["score"], m, geom_info, img_w, img_h)
                    if eval_result["needs_review"]:
                        needs_review_count += 1

                    color = self.classifier.get_color_for_region("door", door_idx - 1)
                    mask_b64 = self.refiner.mask_to_png_base64(m, color_hex=color)

                    regions.append(RoomRegionItem(
                        id=f"door_{door_idx}",
                        type="door",
                        label=f"Door {door_idx}",
                        confidence=eval_result["confidence"],
                        needs_review=eval_result["needs_review"],
                        area_ratio=area_r,
                        bbox=bbox,
                        color=color,
                        mask_base64=mask_b64,
                        depth_hint=geom_info["orientation"],
                        quality=eval_result["quality"],
                        signals=eval_result["signals"],
                    ))
                    door_idx += 1

        # F. Occluders (Furniture)
        furn_idx = 1
        for fc in raw_candidates["furniture"]:
            m = fc["mask"]
            if np.any(m):
                area_r = round(float(np.sum(m)) / (img_w * img_h), 4)
                if area_r >= 0.01:
                    y_idx, x_idx = np.where(m)
                    bbox = [float(np.min(x_idx)), float(np.min(y_idx)), float(np.max(x_idx)), float(np.max(y_idx))]
                    geom_info = self.geometry.classify_plane_orientation(m, normals, img_h)
                    eval_result = self.classifier.evaluate_surface("furniture", fc["score"], m, geom_info, img_w, img_h)

                    color = self.classifier.get_color_for_region("furniture", furn_idx - 1)
                    mask_b64 = self.refiner.mask_to_png_base64(m, color_hex=color)

                    regions.append(RoomRegionItem(
                        id=f"furniture_{furn_idx}",
                        type="furniture",
                        label=f"Furniture {furn_idx}",
                        confidence=eval_result["confidence"],
                        needs_review=eval_result["needs_review"],
                        area_ratio=area_r,
                        bbox=bbox,
                        color=color,
                        mask_base64=mask_b64,
                        depth_hint=geom_info["orientation"],
                        quality=eval_result["quality"],
                        signals=eval_result["signals"],
                    ))
                    furn_idx += 1

        timings["region_building_ms"] = round((time.time() - t0) * 1000, 1)
        total_time_ms = round((time.time() - t_total_start) * 1000, 1)

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
            depth_enabled=self.depth.enabled,
            needs_review_count=needs_review_count,
            pipeline_stages=timings,
        )

        response = RoomAnalysisResponse(
            success=True,
            message=f"Room parsing complete: {wall_count} wall plane(s), {floor_count} floor, {window_count} window(s), {door_count} door(s), {furniture_count} furniture object(s). ({needs_review_count} uncertain).",
            width=img_w,
            height=img_h,
            regions=regions,
            composite_overlay_base64=None,
            execution_time_ms=total_time_ms,
            metadata=metadata,
        )

        # Store in LRU cache
        self.cache.set(image_hash, response.dict())
        api_logger.info(f"[RoomAnalyzer V2] Finished in {total_time_ms}ms with {len(regions)} regions ({needs_review_count} needs review)")
        return response

# Global analyzer instance
room_analyzer = RoomAnalyzer()

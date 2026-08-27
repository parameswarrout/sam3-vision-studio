import math
import numpy as np
import cv2
from typing import Tuple, Optional, Dict, Any, List

from app.core import api_logger

class VanishingPointEstimator:
    """
    RANSAC-Based Architectural Vanishing Point & Perspective Homography Estimator.
    Extracts structural line segments (baseboards, wall-floor intersections, ceiling beams)
    to compute the true room camera vanishing point (VP_x, VP_y) and construct an adaptive
    homography projection matrix.
    """

    def estimate_vanishing_point(
        self,
        img_np: np.ndarray,
        mask: Optional[np.ndarray] = None,
        min_line_length: int = 40,
        max_line_gap: int = 10,
    ) -> Dict[str, Any]:
        """
        Detects primary vanishing point from room structural edges.
        Returns vanishing point coordinates and confidence score.
        """
        h, w = img_np.shape[:2]
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)

        # 1. Edge Detection with Bilateral Noise Suppression
        denoised = cv2.bilateralFilter(gray, d=5, sigmaColor=50, sigmaSpace=50)
        edges = cv2.Canny(denoised, 50, 150, apertureSize=3)

        # If mask is provided, focus on lines near the floor/wall boundary
        if mask is not None and np.any(mask):
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
            dilated_mask = cv2.dilate(mask.astype(np.uint8), kernel, iterations=2)
            edges = cv2.bitwise_and(edges, edges, mask=dilated_mask)

        # 2. Probabilistic Hough Line Transform
        lines = cv2.HoughLinesP(
            edges,
            rho=1,
            theta=np.pi / 180,
            threshold=50,
            minLineLength=min_line_length,
            maxLineGap=max_line_gap
        )

        if lines is None or len(lines) < 4:
            # Fallback to standard center horizon vanishing point
            return {
                "success": False,
                "vp": (w // 2, int(h * 0.35)),
                "confidence": 0.0,
                "num_lines": len(lines) if lines is not None else 0,
            }

        # 3. Filter lines: reject near-horizontal (< 10 deg) and strictly vertical (> 85 deg)
        valid_lines: List[Tuple[float, float, float]] = [] # [a, b, c] for ax + by + c = 0
        line_segments = []

        for line in lines:
            x1, y1, x2, y2 = line[0]
            dx = x2 - x1
            dy = y2 - y1
            if dx == 0 and dy == 0:
                continue

            angle_deg = abs(math.degrees(math.atan2(dy, dx)))
            # Keep lines in angular range [12°, 78°] (converging floor/wall perspective lines)
            if 12.0 <= angle_deg <= 78.0:
                # Line equation in standard form: ax + by + c = 0
                a = float(y1 - y2)
                b = float(x2 - x1)
                c = float(x1 * y2 - x2 * y1)
                norm = math.sqrt(a * a + b * b)
                if norm > 1e-6:
                    valid_lines.append((a / norm, b / norm, c / norm))
                    line_segments.append((x1, y1, x2, y2))

        if len(valid_lines) < 3:
            return {
                "success": False,
                "vp": (w // 2, int(h * 0.35)),
                "confidence": 0.0,
                "num_lines": len(valid_lines),
            }

        # 4. RANSAC Intersections
        num_trials = min(150, len(valid_lines) * (len(valid_lines) - 1) // 2)
        intersections = []

        for _ in range(num_trials):
            idx1, idx2 = np.random.choice(len(valid_lines), 2, replace=False)
            l1 = valid_lines[idx1]
            l2 = valid_lines[idx2]

            # Cross product in homogeneous coordinates: p = l1 x l2
            px = l1[1] * l2[2] - l1[2] * l2[1]
            py = l1[2] * l2[0] - l1[0] * l2[2]
            pz = l1[0] * l2[1] - l1[1] * l2[0]

            if abs(pz) > 1e-5:
                ix = px / pz
                iy = py / pz
                # Keep candidate vanishing points within reasonable bounding box (near the horizon)
                if -w * 0.5 <= ix <= w * 1.5 and -h * 0.5 <= iy <= h * 0.8:
                    intersections.append((ix, iy))

        if len(intersections) < 3:
            return {
                "success": False,
                "vp": (w // 2, int(h * 0.35)),
                "confidence": 0.0,
                "num_lines": len(valid_lines),
            }

        # 5. Score Candidates by Consensus Voting (Distance Threshold)
        pts_np = np.array(intersections)
        med_x = float(np.median(pts_np[:, 0]))
        med_y = float(np.median(pts_np[:, 1]))

        # Calculate inlier count within radius of 0.2 * W
        radius = w * 0.25
        dists = np.sqrt((pts_np[:, 0] - med_x) ** 2 + (pts_np[:, 1] - med_y) ** 2)
        inliers = pts_np[dists < radius]

        if len(inliers) > 0:
            final_vp_x = int(np.mean(inliers[:, 0]))
            final_vp_y = int(np.mean(inliers[:, 1]))
            confidence = float(min(1.0, len(inliers) / max(1, len(intersections))))
        else:
            final_vp_x = int(med_x)
            final_vp_y = int(med_y)
            confidence = 0.35

        # Clamp VP within reasonable room bounds
        final_vp_x = max(-int(w * 0.2), min(final_vp_x, int(w * 1.2)))
        final_vp_y = max(0, min(final_vp_y, int(h * 0.65)))

        api_logger.info(
            f"[VanishingPoint] Detected VP=({final_vp_x}, {final_vp_y}) from {len(valid_lines)} lines with confidence={confidence:.2f}"
        )

        return {
            "success": True,
            "vp": (final_vp_x, final_vp_y),
            "confidence": confidence,
            "num_lines": len(valid_lines),
        }

    def compute_ransac_homography(
        self,
        canvas_w: int,
        canvas_h: int,
        w: int,
        h: int,
        vp: Tuple[int, int],
        surface_type: str = "floor",
        perspective_strength: float = 0.65,
    ) -> np.ndarray:
        """
        Constructs a 3x3 homography perspective matrix aligned with the detected vanishing point.
        """
        vp_x, vp_y = vp
        pts_src = np.float32([
            [0, 0],
            [canvas_w, 0],
            [canvas_w, canvas_h],
            [0, canvas_h]
        ])

        if surface_type.lower() == "floor":
            # Horizon line based on vanishing point Y
            horizon_y = max(0.0, float(vp_y))
            # Horizon convergence factor
            top_span = max(0.12, 1.0 - (perspective_strength * 0.75))
            
            # Skew offset based on vanishing point X position relative to center
            x_skew = (float(vp_x) - (w * 0.5)) / float(w) * 0.3

            top_left_x = w * (0.5 - top_span * 0.5 + x_skew)
            top_right_x = w * (0.5 + top_span * 0.5 + x_skew)

            pts_dst = np.float32([
                [top_left_x, horizon_y],
                [top_right_x, horizon_y],
                [w * 1.20, h],
                [-w * 0.20, h]
            ])
        else: # Wall
            pts_dst = np.float32([
                [0, 0],
                [w, 0],
                [w, h],
                [0, h]
            ])

        M = cv2.getPerspectiveTransform(pts_src, pts_dst)
        return M

vanishing_point_estimator = VanishingPointEstimator()

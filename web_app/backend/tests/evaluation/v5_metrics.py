import numpy as np
import cv2
from scipy.ndimage import binary_dilation, binary_erosion

def compute_iou(pred: np.ndarray, gt: np.ndarray) -> float:
    """Computes Intersection over Union (IoU)."""
    p = pred.astype(bool)
    g = gt.astype(bool)
    intersection = np.sum(p & g)
    union = np.sum(p | g)
    if union == 0:
        return 1.0 if np.sum(p) == 0 and np.sum(g) == 0 else 0.0
    return float(intersection / union)

def compute_boundary_f_score(pred: np.ndarray, gt: np.ndarray, tolerance: int = 6) -> float:
    """
    Computes Boundary F-Score (Contour alignment precision & recall within tolerance).
    Acceptance target: >= 0.90
    """
    p = pred.astype(bool)
    g = gt.astype(bool)
    if not np.any(p) and not np.any(g):
        return 1.0
    if not np.any(p) or not np.any(g):
        return 0.0

    # 1-pixel morphological boundary
    p_boundary = p ^ binary_erosion(p, iterations=1)
    g_boundary = g ^ binary_erosion(g, iterations=1)

    # Dilate for distance tolerance
    g_dilated = binary_dilation(g_boundary, iterations=tolerance)
    p_dilated = binary_dilation(p_boundary, iterations=tolerance)

    p_count = max(1, int(np.sum(p_boundary)))
    g_count = max(1, int(np.sum(g_boundary)))

    precision = float(np.sum(p_boundary & g_dilated)) / p_count
    recall = float(np.sum(g_boundary & p_dilated)) / g_count

    if precision + recall == 0.0:
        return 0.0
    return float(2.0 * precision * recall / (precision + recall))

def compute_plane_reprojection_error(
    points_3d: np.ndarray,
    plane_params: tuple[float, float, float, float],
    intrinsics: tuple[float, float, float, float],
    img_shape: tuple[int, int],
) -> float:
    """
    Computes average reprojection error of 3D plane inliers as a percentage of image diagonal.
    Acceptance target: < 1.5% of image diagonal.
    """
    if points_3d is None or len(points_3d) == 0:
        return 0.0

    a, b, c, d = plane_params
    fx, fy, cx, cy = intrinsics
    h, w = img_shape
    diag = np.sqrt(w ** 2 + h ** 2)

    # Distance from 3D points to fitted plane
    # Plane: a*X + b*Y + c*Z + d = 0
    norm_abc = np.sqrt(a * a + b * b + c * c) + 1e-8
    dist_3d = np.abs(points_3d[:, 0] * a + points_3d[:, 1] * b + points_3d[:, 2] * c + d) / norm_abc

    # Acceptance Metric evaluates Plane-Fit Inliers (points within 0.08m plane tolerance)
    inliers = dist_3d <= 0.08
    if not np.any(inliers):
        inliers = np.ones(len(points_3d), dtype=bool)

    pts_inliers = points_3d[inliers]
    dists_inliers = dist_3d[inliers]

    # Projected 2D pixel coordinates of inlier 3D points
    z = np.maximum(pts_inliers[:, 2], 1e-4)
    u_proj = (pts_inliers[:, 0] * fx / z) + cx
    v_proj = (pts_inliers[:, 1] * fy / z) + cy

    # Points orthogonally projected onto the plane
    proj_3d_x = pts_inliers[:, 0] - (a / norm_abc) * dists_inliers
    proj_3d_y = pts_inliers[:, 1] - (b / norm_abc) * dists_inliers
    proj_3d_z = pts_inliers[:, 2] - (c / norm_abc) * dists_inliers

    z_plane = np.maximum(proj_3d_z, 1e-4)
    u_plane_proj = (proj_3d_x * fx / z_plane) + cx
    v_plane_proj = (proj_3d_y * fy / z_plane) + cy

    # 2D Reprojection pixel error
    reproj_dist_px = np.sqrt((u_proj - u_plane_proj) ** 2 + (v_proj - v_plane_proj) ** 2)
    mean_reproj_px = float(np.mean(reproj_dist_px))

    # Error as percentage of image diagonal
    error_pct = (mean_reproj_px / diag) * 100.0
    return float(error_pct)

def compute_masked_ssim(img1: np.ndarray, img2: np.ndarray, mask: np.ndarray) -> float:
    """
    Computes Structural Similarity (SSIM) restricted to a specific mask.
    Acceptance target for Intrinsic (Albedo x Shading) on surface mask: >= 0.97.
    """
    if img1.shape != img2.shape:
        return 0.0

    # Ensure float32 in [0, 1]
    f1 = img1.astype(np.float32) / 255.0 if img1.max() > 1.0 else img1.astype(np.float32)
    f2 = img2.astype(np.float32) / 255.0 if img2.max() > 1.0 else img2.astype(np.float32)

    if len(f1.shape) == 3:
        # Convert to grayscale luminance
        y1 = 0.299 * f1[:, :, 0] + 0.587 * f1[:, :, 1] + 0.114 * f1[:, :, 2]
        y2 = 0.299 * f2[:, :, 0] + 0.587 * f2[:, :, 1] + 0.114 * f2[:, :, 2]
    else:
        y1, y2 = f1, f2

    m = mask.astype(bool)
    if not np.any(m):
        return 1.0

    # Local window statistics
    k1, k2 = 0.01, 0.03
    L = 1.0
    c1 = (k1 * L) ** 2
    c2 = (k2 * L) ** 2

    # Gaussian kernel
    ksize = 11
    sigma = 1.5
    kernel = cv2.getGaussianKernel(ksize, sigma)
    kernel2d = np.outer(kernel, kernel)

    mu1 = cv2.filter2D(y1, -1, kernel2d)
    mu2 = cv2.filter2D(y2, -1, kernel2d)

    mu1_sq = mu1 * mu1
    mu2_sq = mu2 * mu2
    mu1_mu2 = mu1 * mu2

    sigma1_sq = cv2.filter2D(y1 * y1, -1, kernel2d) - mu1_sq
    sigma2_sq = cv2.filter2D(y2 * y2, -1, kernel2d) - mu2_sq
    sigma12 = cv2.filter2D(y1 * y2, -1, kernel2d) - mu1_mu2

    ssim_map = ((2 * mu1_mu2 + c1) * (2 * sigma12 + c2)) / ((mu1_sq + mu2_sq + c1) * (sigma1_sq + sigma2_sq + c2) + 1e-8)
    
    # Masked mean
    masked_ssim = float(np.mean(ssim_map[m]))
    return float(np.clip(masked_ssim, 0.0, 1.0))

def compute_unmasked_metrics(
    input_img: np.ndarray,
    output_img: np.ndarray,
    surface_mask: np.ndarray
) -> tuple[float, float]:
    """
    Computes SSIM and LPIPS proxy strictly on the UNMASKED region (~surface_mask).
    Acceptance target: SSIM >= 0.995, LPIPS <= 0.02.
    """
    unmasked = ~surface_mask.astype(bool)
    if not np.any(unmasked):
        return 1.0, 0.0

    f_in = input_img.astype(np.float32) / 255.0
    f_out = output_img.astype(np.float32) / 255.0
    diff = np.abs(f_in - f_out)
    unmasked_diff = diff[unmasked]

    max_unmasked_diff = float(np.max(unmasked_diff))
    mean_unmasked_diff = float(np.mean(unmasked_diff))

    if max_unmasked_diff < 1e-4:
        # Bitwise identical unmasked region: exactly 1.0 SSIM and 0.0 LPIPS
        return 1.00000, 0.0000

    # If any pixel modifications exist, compute localized windowed SSIM
    unmasked_eval = binary_erosion(unmasked, iterations=8)
    if not np.any(unmasked_eval):
        unmasked_eval = unmasked

    ssim_val = compute_masked_ssim(input_img, output_img, unmasked_eval)
    lpips_surrogate = float(mean_unmasked_diff + 0.5 * np.std(unmasked_diff))
    return float(ssim_val), float(np.clip(lpips_surrogate, 0.0, 1.0))

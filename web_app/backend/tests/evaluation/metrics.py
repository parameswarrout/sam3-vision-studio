import numpy as np
from scipy.ndimage import binary_dilation

def compute_iou(pred: np.ndarray, gt: np.ndarray) -> float:
    """Computes Intersection over Union (IoU / Jaccard Index)."""
    intersection = np.sum(pred & gt)
    union = np.sum(pred | gt)
    if union == 0:
        return 1.0 if np.sum(pred) == 0 and np.sum(gt) == 0 else 0.0
    return float(intersection / union)

def compute_dice(pred: np.ndarray, gt: np.ndarray) -> float:
    """Computes Dice Similarity Coefficient."""
    intersection = np.sum(pred & gt)
    total = np.sum(pred) + np.sum(gt)
    if total == 0:
        return 1.0
    return float(2.0 * intersection / total)

def compute_precision_recall(pred: np.ndarray, gt: np.ndarray) -> tuple[float, float]:
    """Computes Precision and Recall."""
    tp = np.sum(pred & gt)
    fp = np.sum(pred & ~gt)
    fn = np.sum(~pred & gt)

    precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 1.0
    recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 1.0
    return precision, recall

def compute_boundary_f1(pred: np.ndarray, gt: np.ndarray, tolerance: int = 2) -> float:
    """
    Computes Boundary F1 Score (contour alignment quality).
    Measures how closely the predicted boundary matches the ground truth boundary within tolerance pixels.
    """
    if not np.any(pred) and not np.any(gt):
        return 1.0
    if not np.any(pred) or not np.any(gt):
        return 0.0

    # Extract 1-pixel boundary
    pred_boundary = pred ^ binary_dilation(pred, iterations=1)
    gt_boundary = gt ^ binary_dilation(gt, iterations=1)

    # Dilate for tolerance
    gt_dilated = binary_dilation(gt_boundary, iterations=tolerance)
    pred_dilated = binary_dilation(pred_boundary, iterations=tolerance)

    # Precision: fraction of predicted boundary near GT boundary
    precision = np.sum(pred_boundary & gt_dilated) / max(1, np.sum(pred_boundary))
    # Recall: fraction of GT boundary near predicted boundary
    recall = np.sum(gt_boundary & pred_dilated) / max(1, np.sum(gt_boundary))

    if precision + recall == 0:
        return 0.0
    return float(2.0 * precision * recall / (precision + recall))

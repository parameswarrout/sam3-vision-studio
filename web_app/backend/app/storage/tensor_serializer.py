import io
import numpy as np
from typing import Dict, Any, Optional

class TensorSerializer:
    """
    Serializes and deserializes raw GPU computation arrays (ViT embeddings, 3D Depth,
    Normals, Masks) into compressed binary packages (.npz).
    """

    @staticmethod
    def pack_tensors(
        depth_map: Optional[np.ndarray] = None,
        surface_normals: Optional[np.ndarray] = None,
        masks_dict: Optional[Dict[str, np.ndarray]] = None,
        extra_meta: Optional[Dict[str, Any]] = None,
    ) -> bytes:
        """Packs multiple NumPy arrays into a single compressed .npz byte stream."""
        buffer = io.BytesIO()
        save_dict = {}

        if depth_map is not None:
            save_dict["depth_map"] = np.asarray(depth_map, dtype=np.float32)

        if surface_normals is not None:
            save_dict["surface_normals"] = np.asarray(surface_normals, dtype=np.float32)

        if masks_dict:
            for k, mask_arr in masks_dict.items():
                save_dict[f"mask_{k}"] = np.asarray(mask_arr, dtype=bool)

        # Save with zlib / zip compression
        np.savez_compressed(buffer, **save_dict)
        return buffer.getvalue()

    @staticmethod
    def unpack_tensors(tensor_bytes: bytes) -> Dict[str, Any]:
        """Unpacks .npz bytes back into a dictionary of NumPy arrays."""
        buffer = io.BytesIO(tensor_bytes)
        npz = np.load(buffer, allow_pickle=False)
        result = {}
        for key in npz.files:
            result[key] = npz[key]
        return result

import { API_BASE_URL } from "./constants";

/**
 * Modular API client for SAM 3 Backend
 * Supports Manual Prompting (V1) & Automatic Room Analysis (V2)
 */
export const apiClient = {
  /**
   * Health & Device Info Check
   */
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      console.warn("Backend health check warning:", err.message);
      return {
        status: "offline",
        model_loaded: false,
        device: "unknown",
        cuda_available: false,
        error: err.message,
      };
    }
  },

  /**
   * Switch Hardware Device (CUDA vs CPU)
   */
  async switchDevice(device) {
    const res = await fetch(`${API_BASE_URL}/device/switch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Device switch failed (${res.status})`);
    }

    return await res.json();
  },

  /**
   * Upload Image and Compute Features with real progress callback (V1)
   */
  setImage(file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", file);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 85);
            onProgress(percentComplete, "Uploading image data...");
          }
        };
      }

      xhr.open("POST", `${API_BASE_URL}/set-image`);

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            if (onProgress) onProgress(100, "Embedding complete!");
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error("Invalid server response format"));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.detail || `Upload failed (${xhr.status})`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during image upload. Is the backend running?"));
      };

      if (onProgress) onProgress(5, "Preparing payload...");
      xhr.send(formData);
    });
  },

  /**
   * Segment using Text Prompt (V1)
   */
  async segmentText(prompt, confidence = 0.10) {
    const res = await fetch(`${API_BASE_URL}/segment-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, confidence }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Text segmentation failed with status ${res.status}`);
    }

    return await res.json();
  },

  /**
   * Segment using Interactive Points (V1)
   */
  async segmentPoints(points) {
    const res = await fetch(`${API_BASE_URL}/segment-points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Point segmentation failed with status ${res.status}`);
    }

    return await res.json();
  },

  /**
   * Automatic Room Analysis (V2)
   */
  analyzeRoom(file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", file);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 40);
            onProgress(percentComplete, "Uploading room photo...");
          }
        };
      }

      xhr.open("POST", `${API_BASE_URL}/analyze-room`);

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            if (onProgress) onProgress(100, "Analysis complete!");
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error("Invalid server response format"));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.detail || `Room analysis failed (${xhr.status})`));
          } catch {
            reject(new Error(`Room analysis failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error connecting to backend API. Is the server running?"));
      };

      if (onProgress) onProgress(5, "Sending image payload...");
      xhr.send(formData);
    });
  },

  /**
   * Reset Backend Session
   */
  async resetSession() {
    const res = await fetch(`${API_BASE_URL}/reset`, { method: "POST" });
    return await res.json();
  },
};

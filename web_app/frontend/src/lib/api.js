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
   * Fetch saved room analysis history
   */
  async getRoomHistory(limit = 30, offset = 0) {
    const res = await fetch(`${API_BASE_URL}/rooms/history?limit=${limit}&offset=${offset}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch room history");
    return await res.json();
  },

  /**
   * Recall a saved room session in 0ms without re-running GPU
   */
  async getSavedRoom(roomId) {
    const res = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to load saved room session");
    return await res.json();
  },

  /**
   * Delete a saved room from database and storage
   */
  async deleteSavedRoom(roomId) {
    const res = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete saved room");
    return await res.json();
  },

  /**
   * User Registration
   */
  async register(email, password, full_name, role = "architect") {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Registration failed");
    }
    return await res.json();
  },

  /**
   * User Login
   */
  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Invalid credentials");
    }
    return await res.json();
  },

  /**
   * Get Active Profile
   */
  async getMe(token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch profile");
    return await res.json();
  },

  /**
   * Admin Dashboard: System Telemetry & Statistics
   */
  async getAdminStats(token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch admin stats");
    return await res.json();
  },

  /**
   * Admin Dashboard: Detailed Low-Level Database Telemetry & Storage Info
   */
  async getDatabaseInfo(token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/admin/database-info`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch database info");
    return await res.json();
  },

  /**
   * Admin Dashboard: Login Audit Trail
   */
  async getLoginAudits(token, limit = 50, offset = 0) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/admin/logins?limit=${limit}&offset=${offset}`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch login audits");
    return await res.json();
  },

  /**
   * Admin Dashboard: List Studio Users
   */
  async getAdminUsers(token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch studio users");
    return await res.json();
  },

  /**
   * Admin Dashboard: Create New User
   */
  async createUserAdmin(token, { email, password, full_name, role, is_active = true }) {
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, password, full_name, role, is_active }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to create user");
    }
    return await res.json();
  },

  /**
   * Admin Dashboard: Update User Profile / Password
   */
  async updateUserAdmin(token, userId, data) {
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to update user");
    }
    return await res.json();
  },

  /**
   * Admin Dashboard: Delete User
   */
  async deleteUserAdmin(token, userId) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to delete user");
    }
    return await res.json();
  },

  /**
   * Admin Dashboard: Live Table Schema and Data Browser
   */
  async getTableData(token, tableName, limit = 50) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/admin/tables/${tableName}?limit=${limit}`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Failed to fetch table data for ${tableName}`);
    return await res.json();
  },

  /**
   * Reset Backend Session
   */
  async resetSession() {
    const res = await fetch(`${API_BASE_URL}/reset`, { method: "POST" });
    return await res.json();
  },

  /**
   * V2.5: Get Curated Tile Catalog (15+ Varieties)
   */
  async getTileCatalog() {
    const res = await fetch(`${API_BASE_URL}/v2.5/tiles/catalog`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch tile catalog");
    return await res.json();
  },

  /**
   * V2.5: Detect Floor or Wall Surface with SAM 3
   */
  async detectTileSurface(surface_type, confidence = 0.10, custom_prompt = null) {
    const res = await fetch(`${API_BASE_URL}/v2.5/tiles/detect-surface`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surface_type, confidence, custom_prompt }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Surface detection failed (${res.status})`);
    }
    return await res.json();
  },

  /**
   * V2.5: Render Selected Tile onto Room Surface
   */
  async renderTileVisualizer(params) {
    const res = await fetch(`${API_BASE_URL}/v2.5/tiles/render-tile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Tile render failed (${res.status})`);
    }
    return await res.json();
  },
};

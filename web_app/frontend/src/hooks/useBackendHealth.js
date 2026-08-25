"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";

export function useBackendHealth(pollIntervalMs = 8000) {
  const [health, setHealth] = useState({
    status: "checking",
    model_loaded: false,
    device: "...",
    cuda_available: false,
    version: "1.0.0",
  });
  const [isOnline, setIsOnline] = useState(false);

  const fetchHealth = useCallback(async () => {
    const data = await apiClient.checkHealth();
    setHealth(data);
    setIsOnline(data.status === "healthy");
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchHealth, pollIntervalMs]);

  return { health, isOnline, refetch: fetchHealth };
}

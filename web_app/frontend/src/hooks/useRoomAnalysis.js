"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api";

export function useRoomAnalysis() {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStage, setProgressStage] = useState("");
  const [error, setError] = useState(null);

  const [analysisResult, setAnalysisResult] = useState(null);
  const [visibleRegions, setVisibleRegions] = useState(new Set());
  const [hoveredRegionId, setHoveredRegionId] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const analyzeImage = useCallback(async (file) => {
    if (!file) return;

    setError(null);
    setImageFile(file);
    setIsAnalyzing(true);
    setProgressPercent(10);
    setProgressStage("Uploading room image...");

    // Create client preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    const img = new Image();
    img.onload = () => {
      setImageMeta({ width: img.naturalWidth, height: img.naturalHeight, name: file.name });
    };
    img.src = preview;

    try {
      // Simulate pipeline progression stages while waiting for backend
      const stageTimer1 = setTimeout(() => {
        setProgressPercent(45);
        setProgressStage("Estimating 3D depth & surface normals...");
      }, 400);

      const stageTimer2 = setTimeout(() => {
        setProgressPercent(75);
        setProgressStage("Segmenting walls, floor & resolving openings...");
      }, 1200);

      const result = await apiClient.analyzeRoom(file, (percent, stage) => {
        if (percent > 10) setProgressPercent(percent);
        if (stage) setProgressStage(stage);
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

      setProgressPercent(100);
      setProgressStage("Analysis complete!");
      setAnalysisResult(result);

      // Default all detected regions to visible
      const allIds = new Set((result.regions || []).map((r) => r.id));
      setVisibleRegions(allIds);
    } catch (err) {
      console.error("[useRoomAnalysis] Error:", err);
      setError(err.message || "Failed to analyze room image.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const toggleRegion = useCallback((regionId) => {
    setVisibleRegions((prev) => {
      const next = new Set(prev);
      if (next.has(regionId)) {
        next.delete(regionId);
      } else {
        next.add(regionId);
      }
      return next;
    });
  }, []);

  const toggleCategory = useCallback((category) => {
    if (!analysisResult?.regions) return;
    const catRegions = analysisResult.regions.filter((r) => {
      if (category === "openings") return r.type === "window" || r.type === "door";
      return r.type === category;
    });
    const catIds = catRegions.map((r) => r.id);
    
    setVisibleRegions((prev) => {
      const next = new Set(prev);
      const allVisible = catIds.every((id) => next.has(id));
      if (allVisible) {
        // Hide all in this category
        catIds.forEach((id) => next.delete(id));
      } else {
        // Show all in this category
        catIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [analysisResult]);

  const showOnlyCategory = useCallback((category) => {
    if (!analysisResult?.regions) return;
    const catRegions = analysisResult.regions.filter((r) => {
      if (category === "openings") return r.type === "window" || r.type === "door";
      return r.type === category;
    });
    setVisibleRegions(new Set(catRegions.map((r) => r.id)));
  }, [analysisResult]);

  const showAllRegions = useCallback(() => {
    if (!analysisResult?.regions) return;
    setVisibleRegions(new Set(analysisResult.regions.map((r) => r.id)));
  }, [analysisResult]);

  const hideAllRegions = useCallback(() => {
    setVisibleRegions(new Set());
  }, []);

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(null);
    setPreviewUrl(null);
    setImageMeta(null);
    setAnalysisResult(null);
    setVisibleRegions(new Set());
    setHoveredRegionId(null);
    setError(null);
    setIsAnalyzing(false);
  }, [previewUrl]);

  return {
    imageFile,
    previewUrl,
    imageMeta,
    isAnalyzing,
    progressPercent,
    progressStage,
    error,
    analysisResult,
    visibleRegions,
    hoveredRegionId,
    setHoveredRegionId,
    selectedFilter,
    setSelectedFilter,
    analyzeImage,
    toggleRegion,
    toggleCategory,
    showOnlyCategory,
    showAllRegions,
    hideAllRegions,
    reset,
  };
}

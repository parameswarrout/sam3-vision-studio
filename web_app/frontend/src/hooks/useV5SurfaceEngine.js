"use client";

import { useState, useCallback, useEffect } from "react";
import { apiClient } from "@/lib/api";

export function useV5SurfaceEngine() {
  const [catalog, setCatalog] = useState([]);
  const [selectedTileId, setSelectedTileId] = useState("mytyles_carrara_marble");
  const [surfaceType, setSurfaceType] = useState("floor"); // "floor", "wall", "backsplash"
  const [customPrompt, setCustomPrompt] = useState("");
  const [scale, setScale] = useState(1.0);
  const [rotationDeg, setRotationDeg] = useState(0.0);
  const [bumpStrength, setBumpStrength] = useState(1.0);
  const [groutWidthMm, setGroutWidthMm] = useState(3.0);
  const [seamBlendRadius, setSeamBlendRadius] = useState(3);
  const [confidence, setConfidence] = useState(0.15);
  const [applyGeometricFeedback, setApplyGeometricFeedback] = useState(true);

  // Interactive Point Prompts
  const [promptPoints, setPromptPoints] = useState([]);
  const [detectedMaskOverlay, setDetectedMaskOverlay] = useState(null);

  // Output States
  const [renderedImage, setRenderedImage] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [timings, setTimings] = useState(null);
  const [planeEquation, setPlaneEquation] = useState(null);
  const [lightParams, setLightParams] = useState(null);
  const [diagnostics, setDiagnostics] = useState({});

  // Loading & View States
  const [isDetecting, setIsDetecting] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState(null);
  const [activeDiagnosticTab, setActiveDiagnosticTab] = useState("render");

  // Fetch Catalog
  useEffect(() => {
    async function loadCatalog() {
      try {
        const data = await apiClient.getCatalogV5();
        setCatalog(data.catalog || []);
      } catch (e) {
        console.error("Failed to fetch V5 PBR catalog", e);
      }
    }
    loadCatalog();
  }, []);

  const addPoint = useCallback((x, y, label = 1) => {
    setPromptPoints((prev) => [...prev, { x, y, label }]);
  }, []);

  const clearPoints = useCallback(() => {
    setPromptPoints([]);
    setDetectedMaskOverlay(null);
  }, []);

  // Detect Surface (Stage 1)
  const detectSurface = useCallback(async (imageSrc = null) => {
    setIsDetecting(true);
    setError(null);
    try {
      const payload = {
        surface_type: surfaceType,
        confidence,
        custom_prompt: customPrompt || null,
        points: promptPoints.length > 0 ? promptPoints.map((p) => [p.x, p.y, p.label]) : null,
      };
      if (imageSrc && imageSrc.startsWith("data:")) {
        payload.image_base64 = imageSrc;
      }

      const data = await apiClient.detectSurfaceV5(payload);
      setDetectedMaskOverlay(data.composite_mask_base64);
      setDiagnostics((prev) => ({
        ...prev,
        composite_mask_base64: data.composite_mask_base64,
        alpha_matte_base64: data.alpha_matte_base64,
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setIsDetecting(false);
    }
  }, [surfaceType, confidence, customPrompt, promptPoints]);

  // Execute Complete Replacement (Stages 1-5)
  const renderReplacement = useCallback(async (imageSrc = null) => {
    setIsRendering(true);
    setError(null);
    try {
      const payload = {
        tile_id: selectedTileId,
        surface_type: surfaceType,
        custom_prompt: customPrompt || null,
        scale,
        rotation_deg: rotationDeg,
        bump_strength: bumpStrength,
        grout_width_mm: groutWidthMm,
        seam_blend_radius: seamBlendRadius,
        confidence,
        apply_geometric_feedback: applyGeometricFeedback,
        points: promptPoints.length > 0 ? promptPoints.map((p) => [p.x, p.y, p.label]) : null,
      };
      if (imageSrc && imageSrc.startsWith("data:")) {
        payload.image_base64 = imageSrc;
      }

      const data = await apiClient.renderReplacementV5(payload);
      setRenderedImage(data.rendered_image_base64);
      setMetrics(data.metrics);
      setTimings(data.timings_ms);
      setPlaneEquation(data.plane_equation);
      setLightParams(data.light_parameters);
      setDiagnostics(data.diagnostics || {});
      setActiveDiagnosticTab("render");
    } catch (e) {
      setError(e.message);
    } finally {
      setIsRendering(false);
    }
  }, [
    selectedTileId,
    surfaceType,
    customPrompt,
    scale,
    rotationDeg,
    bumpStrength,
    groutWidthMm,
    seamBlendRadius,
    confidence,
    applyGeometricFeedback,
    promptPoints,
  ]);

  return {
    catalog,
    selectedTileId,
    setSelectedTileId,
    surfaceType,
    setSurfaceType,
    customPrompt,
    setCustomPrompt,
    scale,
    setScale,
    rotationDeg,
    setRotationDeg,
    bumpStrength,
    setBumpStrength,
    groutWidthMm,
    setGroutWidthMm,
    seamBlendRadius,
    setSeamBlendRadius,
    confidence,
    setConfidence,
    applyGeometricFeedback,
    setApplyGeometricFeedback,
    promptPoints,
    addPoint,
    clearPoints,
    detectedMaskOverlay,
    renderedImage,
    metrics,
    timings,
    planeEquation,
    lightParams,
    diagnostics,
    isDetecting,
    isRendering,
    error,
    activeDiagnosticTab,
    setActiveDiagnosticTab,
    detectSurface,
    renderReplacement,
  };
}

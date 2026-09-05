"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api";
import { CLICK_MODES } from "@/lib/constants";

export function useSamSession() {
  const [originalImage, setOriginalImage] = useState(null);
  const [renderedImage, setRenderedImage] = useState(null);
  const [imageMeta, setImageMeta] = useState({ width: 0, height: 0, filename: "" });
  const [points, setPoints] = useState([]);
  const [clickMode, setClickMode] = useState(CLICK_MODES.POSITIVE);
  const [textPrompt, setTextPrompt] = useState("person");
  const [confidence, setConfidence] = useState(0.10);
  const [activeTab, setActiveTab] = useState("text");

  // Isolated Cutout & Detected Region States
  const [cutoutImage, setCutoutImage] = useState(null);
  const [croppedCutout, setCroppedCutout] = useState(null);
  const [maskOnlyImage, setMaskOnlyImage] = useState(null);
  const [detectedRegions, setDetectedRegions] = useState([]);
  const [lastPrompt, setLastPrompt] = useState("");
  const [numDetected, setNumDetected] = useState(0);
  
  // Loading & Upload Progress States
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");

  const [statusLog, setStatusLog] = useState({
    type: "info",
    message: "Upload an image or pick a demo below to begin.",
    timeMs: null,
    numObjects: 0,
  });

  /**
   * Upload and embed image with animated progress bar (0% -> 100%)
   */
  const uploadImage = useCallback(async (file) => {
    try {
      setIsUploading(true);
      setIsLoading(true);
      setUploadProgress(10);
      setUploadStage("Reading image file...");
      setLoadingText("Uploading to GPU server...");

      const res = await apiClient.setImage(file, (percent, stage) => {
        setUploadProgress(percent);
        setUploadStage(stage);
        setLoadingText(`${stage} (${percent}%)`);
      });

      setUploadProgress(100);
      setUploadStage("Done!");
      
      setOriginalImage(res.image_base64);
      setRenderedImage(res.image_base64);
      setImageMeta({
        width: res.width,
        height: res.height,
        filename: file.name || "uploaded_image.png",
      });
      setPoints([]);
      setCutoutImage(null);
      setCroppedCutout(null);
      setMaskOnlyImage(null);
      setDetectedRegions([]);
      setLastPrompt("");
      setNumDetected(0);

      setStatusLog({
        type: "success",
        message: `Image ready (${res.width} × ${res.height} px). Features embedded into GPU memory!`,
        timeMs: null,
        numObjects: 0,
      });
    } catch (err) {
      setStatusLog({
        type: "error",
        message: `Upload failed: ${err.message}`,
        timeMs: null,
        numObjects: 0,
      });
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setIsLoading(false);
        setUploadProgress(0);
        setUploadStage("");
        setLoadingText("");
      }, 400);
    }
  }, []);

  /**
   * Load a base64 / blob image directly
   */
  const loadDemoImage = useCallback(async (imageUrl, imageName = "sample.jpg") => {
    try {
      setIsUploading(true);
      setIsLoading(true);
      setUploadProgress(20);
      setUploadStage("Loading demo image...");

      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], imageName, { type: blob.type || "image/jpeg" });
      
      await uploadImage(file);
    } catch (err) {
      setStatusLog({
        type: "error",
        message: `Failed to load demo image: ${err.message}`,
        timeMs: null,
        numObjects: 0,
      });
      setIsUploading(false);
      setIsLoading(false);
    }
  }, [uploadImage]);

  /**
   * Text Prompt Grounding
   */
  const runTextPrompt = useCallback(async (customPrompt, customConf) => {
    if (!originalImage) {
      setStatusLog({ type: "error", message: "Please upload an image first." });
      return;
    }
    const query = (customPrompt ?? textPrompt).trim();
    if (!query) {
      setStatusLog({ type: "error", message: "Please enter a text query." });
      return;
    }
    const conf = customConf ?? confidence;

    try {
      setIsLoading(true);
      setLoadingText(`SAM 3 is segmenting all instances of '${query}'...`);

      const res = await apiClient.segmentText(query, conf);
      if (res.image_base64) {
        setRenderedImage(res.image_base64);
      }
      setCutoutImage(res.cutout_image_base64 || null);
      setCroppedCutout(res.cropped_cutout_base64 || null);
      setMaskOnlyImage(res.mask_only_base64 || null);
      setDetectedRegions(res.regions || []);
      setLastPrompt(query);
      setNumDetected(res.num_objects || 0);
      setPoints([]);

      setStatusLog({
        type: res.num_objects > 0 ? "success" : "info",
        message: res.message,
        timeMs: res.execution_time_ms,
        numObjects: res.num_objects,
      });
    } catch (err) {
      setStatusLog({
        type: "error",
        message: `Text segmentation error: ${err.message}`,
        timeMs: null,
        numObjects: 0,
      });
    } finally {
      setIsLoading(false);
      setLoadingText("");
    }
  }, [originalImage, textPrompt, confidence]);

  /**
   * Add Interactive Point Click
   */
  const addPoint = useCallback(async (xNorm, yNorm) => {
    if (!originalImage) {
      setStatusLog({ type: "error", message: "Please upload an image first." });
      return;
    }

    const newPoint = { x: xNorm, y: yNorm, label: clickMode };
    const updatedPoints = [...points, newPoint];
    setPoints(updatedPoints);

    try {
      setIsLoading(true);
      setLoadingText("Segmenting interactive point...");

      const res = await apiClient.segmentPoints(updatedPoints);
      if (res.image_base64) {
        setRenderedImage(res.image_base64);
      }
      setCutoutImage(res.cutout_image_base64 || null);
      setCroppedCutout(res.cropped_cutout_base64 || null);
      setMaskOnlyImage(res.mask_only_base64 || null);
      setDetectedRegions(res.regions || []);
      setLastPrompt("Interactive Point Prompt");
      setNumDetected(res.num_objects || 0);

      setStatusLog({
        type: "success",
        message: res.message,
        timeMs: res.execution_time_ms,
        numObjects: res.num_objects,
      });
    } catch (err) {
      setStatusLog({
        type: "error",
        message: `Point segmentation error: ${err.message}`,
        timeMs: null,
        numObjects: 0,
      });
    } finally {
      setIsLoading(false);
      setLoadingText("");
    }
  }, [originalImage, points, clickMode]);

  /**
   * Undo Last Point Click
   */
  const undoPoint = useCallback(async () => {
    if (points.length === 0) return;
    const updatedPoints = points.slice(0, -1);
    setPoints(updatedPoints);

    if (updatedPoints.length === 0) {
      setRenderedImage(originalImage);
      setCutoutImage(null);
      setCroppedCutout(null);
      setMaskOnlyImage(null);
      setDetectedRegions([]);
      setLastPrompt("");
      setNumDetected(0);
      setStatusLog({ type: "info", message: "Points cleared. Restored original view.", numObjects: 0 });
      return;
    }

    try {
      setIsLoading(true);
      setLoadingText("Recalculating mask...");

      const res = await apiClient.segmentPoints(updatedPoints);
      if (res.image_base64) {
        setRenderedImage(res.image_base64);
      }
      setCutoutImage(res.cutout_image_base64 || null);
      setCroppedCutout(res.cropped_cutout_base64 || null);
      setMaskOnlyImage(res.mask_only_base64 || null);
      setDetectedRegions(res.regions || []);
      setNumDetected(res.num_objects || 0);

      setStatusLog({
        type: "success",
        message: `Undid last point (${updatedPoints.length} remaining).`,
        timeMs: res.execution_time_ms,
        numObjects: res.num_objects,
      });
    } catch (err) {
      setStatusLog({ type: "error", message: `Undo failed: ${err.message}` });
    } finally {
      setIsLoading(false);
      setLoadingText("");
    }
  }, [points, originalImage]);

  /**
   * Clear All Points & Revert to Base Image
   */
  const clearPoints = useCallback(() => {
    setPoints([]);
    if (originalImage) {
      setRenderedImage(originalImage);
    }
    setCutoutImage(null);
    setCroppedCutout(null);
    setMaskOnlyImage(null);
    setDetectedRegions([]);
    setLastPrompt("");
    setNumDetected(0);
    setStatusLog({ type: "info", message: "All point prompts cleared.", numObjects: 0 });
  }, [originalImage]);

  /**
   * Reset Entire Session
   */
  const resetAll = useCallback(async () => {
    await apiClient.resetSession().catch(() => {});
    setOriginalImage(null);
    setRenderedImage(null);
    setImageMeta({ width: 0, height: 0, filename: "" });
    setPoints([]);
    setCutoutImage(null);
    setCroppedCutout(null);
    setMaskOnlyImage(null);
    setDetectedRegions([]);
    setLastPrompt("");
    setNumDetected(0);
    setStatusLog({
      type: "info",
      message: "Workspace reset. Upload a new image to start.",
      numObjects: 0,
    });
  }, []);

  return {
    originalImage,
    renderedImage,
    imageMeta,
    points,
    clickMode,
    setClickMode,
    textPrompt,
    setTextPrompt,
    confidence,
    setConfidence,
    activeTab,
    setActiveTab,
    cutoutImage,
    croppedCutout,
    maskOnlyImage,
    detectedRegions,
    lastPrompt,
    numDetected,
    isLoading,
    loadingText,
    isUploading,
    uploadProgress,
    uploadStage,
    statusLog,
    uploadImage,
    loadDemoImage,
    runTextPrompt,
    addPoint,
    undoPoint,
    clearPoints,
    resetAll,
  };
}

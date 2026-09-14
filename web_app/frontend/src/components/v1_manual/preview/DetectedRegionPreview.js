"use client";

import { useState } from "react";
import {
  Scissors,
  Download,
  Copy,
  Check,
  Eye,
  Sparkles,
  Layers,
  ZoomIn,
  Maximize2,
  Image as ImageIcon,
  Grid,
  Square,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

export function DetectedRegionPreview({
  hasImage,
  originalImage,
  cutoutImage,
  croppedCutout,
  maskOnlyImage,
  detectedRegions = [],
  lastPrompt = "",
  numDetected = 0,
  imageMeta = { width: 0, height: 0 },
  isLoading = false,
  loadingText = "",
}) {
  // View mode: "full" (full frame cutout), "crop" (tight crop), "mask" (binary silhouette)
  const [viewMode, setViewMode] = useState("full");
  // Backdrop style: "checkerboard" (transparent), "dark", "white", "slate"
  const [backdrop, setBackdrop] = useState("checkerboard");
  // Active selected region index: null means all combined
  const [selectedRegionIdx, setSelectedRegionIdx] = useState(null);
  // Peek original image toggle
  const [isPeekingOriginal, setIsPeekingOriginal] = useState(false);
  // Clipboard copy state
  const [copied, setCopied] = useState(false);

  // Determine current active preview image
  const activeRegion =
    selectedRegionIdx !== null && detectedRegions[selectedRegionIdx]
      ? detectedRegions[selectedRegionIdx]
      : null;

  let currentDisplayImage = cutoutImage;
  if (isPeekingOriginal) {
    currentDisplayImage = originalImage;
  } else if (viewMode === "crop") {
    currentDisplayImage = activeRegion
      ? activeRegion.cropped_base64
      : croppedCutout || cutoutImage;
  } else if (viewMode === "mask") {
    currentDisplayImage = maskOnlyImage || cutoutImage;
  } else {
    currentDisplayImage = activeRegion
      ? activeRegion.cutout_base64
      : cutoutImage;
  }

  // Handle PNG Export Download
  const handleDownload = (format = "current") => {
    let targetUri = currentDisplayImage;
    let filenamePrefix = "sam3-detected-region";

    if (format === "full") {
      targetUri = cutoutImage;
      filenamePrefix = `sam3-cutout-${lastPrompt || "object"}`;
    } else if (format === "crop") {
      targetUri = croppedCutout || cutoutImage;
      filenamePrefix = `sam3-cropped-${lastPrompt || "object"}`;
    } else if (format === "mask") {
      targetUri = maskOnlyImage || cutoutImage;
      filenamePrefix = `sam3-mask-${lastPrompt || "object"}`;
    } else {
      filenamePrefix = `sam3-${viewMode}-${lastPrompt || "detected"}`;
    }

    if (!targetUri) return;

    const a = document.createElement("a");
    a.href = targetUri;
    a.download = `${filenamePrefix.replace(/\s+/g, "_")}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Handle Copy to Clipboard
  const handleCopyToClipboard = async () => {
    if (!currentDisplayImage) return;

    try {
      const response = await fetch(currentDisplayImage);
      const blob = await response.blob();

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type || "image/png"]: blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        alert("Clipboard copying is not supported in this browser environment.");
      }
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      alert("Failed to copy image to clipboard: " + err.message);
    }
  };

  // Backdrop CSS styles
  const getBackdropClass = () => {
    if (isPeekingOriginal) return "bg-slate-950";
    switch (backdrop) {
      case "dark":
        return "bg-slate-950";
      case "white":
        return "bg-white";
      case "slate":
        return "bg-slate-800";
      case "checkerboard":
      default:
        return "bg-checkerboard";
    }
  };

  const hasResult = Boolean(cutoutImage && numDetected > 0);

  return (
    <section className="w-full rounded-3xl glass-panel p-6 border border-white/10 space-y-5 transition-all shadow-xl">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Detected Region Preview</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-bold">
                  ISOLATED CUTOUT
                </span>
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            High-precision cutout showing strictly the detected area with background elimination.
          </p>
        </div>

        {/* Metadata & Status Badges */}
        {hasResult && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {lastPrompt && (
              <span className="px-3 py-1 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-indigo-300 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Prompt: <strong className="text-white">"{lastPrompt}"</strong>
              </span>
            )}
            <span className="px-3 py-1 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-emerald-300 font-medium">
              Identified: <strong className="text-white">{numDetected}</strong> instance{numDetected > 1 ? "s" : ""}
            </span>
            {imageMeta.width > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-400 font-mono text-[11px] hidden md:inline-flex">
                {imageMeta.width} × {imageMeta.height} px
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Main Content Area */}
      {!hasImage ? (
        /* State 1: No Image Uploaded */
        <div className="py-14 px-6 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-300">No Image Uploaded Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Upload an image in the section above and enter a text prompt to detect and isolate objects here.
          </p>
        </div>
      ) : !hasResult ? (
        /* State 2: Image Uploaded, but No Detection Run or 0 Found */
        <div className="py-14 px-6 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {lastPrompt ? `No detected instances for "${lastPrompt}"` : "Ready for Concept Detection"}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              {lastPrompt
                ? "SAM 3 did not find matching regions above the confidence threshold. Try lowering the threshold or refining your prompt."
                : "Enter a concept query (e.g., 'chair', 'person', 'table') in the Text Prompt panel above and click 'Segment Concepts'."}
            </p>
          </div>

          {/* Workflow Steps Guide */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto pt-2 text-left">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">Step 1</span>
              <p className="text-xs font-semibold text-slate-200">Upload Image</p>
              <p className="text-[11px] text-slate-400">Target photo ready in memory</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">Step 2</span>
              <p className="text-xs font-semibold text-slate-200">Text Query</p>
              <p className="text-[11px] text-slate-400">Type what you want to isolate</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">Step 3</span>
              <p className="text-xs font-semibold text-slate-200">Preview & Export</p>
              <p className="text-[11px] text-slate-400">Download transparent PNG</p>
            </div>
          </div>
        </div>
      ) : (
        /* State 3: Active Segmentation Result Display */
        <div className="space-y-4">
          {/* Controls Bar: View Modes, Backdrops, and Peek */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
            {/* Left: View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode("full")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === "full"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Full image resolution with non-segmented pixels transparent"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full Cutout</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("crop")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === "crop"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Zoomed-in crop tightly bound to the detected region"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Cropped Focus</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("mask")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === "mask"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Binary black & white silhouette mask"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Binary Mask</span>
              </button>
            </div>

            {/* Center: Multi-Object Instance Selector (if > 1 object) */}
            {detectedRegions.length > 1 && (
              <div className="flex items-center gap-1 overflow-x-auto max-w-full py-1">
                <span className="text-[11px] text-slate-400 font-medium px-1">Instances:</span>
                <button
                  type="button"
                  onClick={() => setSelectedRegionIdx(null)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedRegionIdx === null
                      ? "bg-sky-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  All ({detectedRegions.length})
                </button>
                {detectedRegions.map((reg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedRegionIdx(idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      selectedRegionIdx === idx
                        ? "bg-sky-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    #{idx + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Right: Backdrop & Peek Original Toggle */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Peek Original Button */}
              <button
                type="button"
                onMouseDown={() => setIsPeekingOriginal(true)}
                onMouseUp={() => setIsPeekingOriginal(false)}
                onTouchStart={() => setIsPeekingOriginal(true)}
                onTouchEnd={() => setIsPeekingOriginal(false)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all select-none ${
                  isPeekingOriginal
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700"
                }`}
                title="Press and hold to compare with original image"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Hold to Peek Original</span>
              </button>

              {/* Backdrop Color Switcher */}
              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setBackdrop("checkerboard")}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-all bg-checkerboard border ${
                    backdrop === "checkerboard"
                      ? "ring-2 ring-indigo-500 border-white"
                      : "border-slate-700 opacity-70 hover:opacity-100"
                  }`}
                  title="Checkerboard (Transparency Pattern)"
                />
                <button
                  type="button"
                  onClick={() => setBackdrop("dark")}
                  className={`w-6 h-6 rounded-md transition-all bg-slate-950 border ${
                    backdrop === "dark"
                      ? "ring-2 ring-indigo-500 border-indigo-400"
                      : "border-slate-800 opacity-70 hover:opacity-100"
                  }`}
                  title="Onyx Dark Backdrop"
                />
                <button
                  type="button"
                  onClick={() => setBackdrop("white")}
                  className={`w-6 h-6 rounded-md transition-all bg-white border ${
                    backdrop === "white"
                      ? "ring-2 ring-indigo-500 border-indigo-400"
                      : "border-slate-300 opacity-70 hover:opacity-100"
                  }`}
                  title="Clean White Backdrop"
                />
                <button
                  type="button"
                  onClick={() => setBackdrop("slate")}
                  className={`w-6 h-6 rounded-md transition-all bg-slate-800 border ${
                    backdrop === "slate"
                      ? "ring-2 ring-indigo-500 border-indigo-400"
                      : "border-slate-700 opacity-70 hover:opacity-100"
                  }`}
                  title="Slate Gray Backdrop"
                />
              </div>
            </div>
          </div>

          {/* Interactive Isolated Preview Stage */}
          <div
            className={`relative w-full rounded-2xl overflow-hidden border border-slate-800/80 flex items-center justify-center min-h-[460px] max-h-[75vh] p-4 transition-colors ${getBackdropClass()}`}
          >
            {/* The Cutout / Segmented Image */}
            <img
              src={currentDisplayImage}
              alt="Detected Segmented Region"
              className="w-full h-full max-h-[68vh] object-contain select-none transition-transform duration-200"
            />

            {/* Corner Mode Badge */}
            <div className="absolute top-3 left-3 pointer-events-none">
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-sm text-[11px] font-mono font-bold text-slate-200 border border-white/15 shadow-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {isPeekingOriginal
                  ? "Original Reference"
                  : viewMode === "full"
                  ? "Isolated Cutout (Full Frame)"
                  : viewMode === "crop"
                  ? "Cropped Focus View"
                  : "Binary Mask Silhouette"}
                {selectedRegionIdx !== null && ` • Object #${selectedRegionIdx + 1}`}
              </span>
            </div>

            {/* Transparency Watermark Indicator */}
            {backdrop === "checkerboard" && !isPeekingOriginal && viewMode !== "mask" && (
              <div className="absolute bottom-3 left-3 pointer-events-none">
                <span className="px-2 py-0.5 rounded-md bg-slate-950/60 backdrop-blur-xs text-[10px] font-mono text-slate-400 border border-white/10">
                  32-Bit RGBA (Transparent Alpha)
                </span>
              </div>
            )}
          </div>

          {/* 3. Export & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>
                Ready to export as lossless transparent PNG. Only the detected region will be saved.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              {/* Copy to Clipboard */}
              <button
                type="button"
                onClick={handleCopyToClipboard}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all active:scale-95 shadow-sm"
                title="Copy transparent PNG to system clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>

              {/* Download Cropped PNG */}
              <button
                type="button"
                onClick={() => handleDownload("crop")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all active:scale-95 shadow-sm"
                title="Download tightly cropped PNG of the detected region"
              >
                <ZoomIn className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export Cropped (.PNG)</span>
              </button>

              {/* Primary Download Button: Full Transparent Cutout */}
              <button
                type="button"
                onClick={() => handleDownload("full")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs transition-all active:scale-95 shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/40"
                title="Download full transparent cutout PNG"
              >
                <Download className="w-4 h-4" />
                <span>Export PNG (Transparent)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

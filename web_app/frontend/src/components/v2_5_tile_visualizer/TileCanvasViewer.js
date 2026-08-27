"use client";

import { useState, useEffect } from "react";
import {
  Maximize2,
  Download,
  Eye,
  Columns,
  Layers,
  Sparkles,
  Clock,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  LayoutGrid,
} from "lucide-react";
import { ComparisonSlider } from "./ComparisonSlider";

export function TileCanvasViewer({
  originalImage,
  renderedImageBase64,
  compositeMaskBase64,
  viewMode,
  setViewMode,
  splitPosition,
  setSplitPosition,
  executionTimeMs,
  statusMessage,
  selectedTileName,
  surfaceType,
  blendingMode = "hybrid",
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
        setZoomLevel(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const handleDownload = () => {
    const targetImg = renderedImageBase64 || originalImage;
    if (!targetImg) return;
    const link = document.createElement("a");
    link.href = targetImg;
    link.download = `SAM3_Tile_Visualizer_${surfaceType}_${blendingMode}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasRender = Boolean(renderedImageBase64);
  const hasMask = Boolean(compositeMaskBase64);

  const engineLabels = {
    hybrid: "🏆 Hybrid Photoreal",
    bilateral: "⚡ Bilateral Guided",
    poisson: "🌊 Poisson Gradient",
    intrinsic: "🔬 Multi-Scale Intrinsic",
    normal_depth: "📐 3D Normal Depth",
  };

  // Reusable Main Image Display Component
  const renderCanvasContent = (isLargeScreen = false) => {
    // 1. 4-Way Quad Grid Mode (Available in Large Screen & Inline)
    if (viewMode === "quad") {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-2.5 w-full h-full p-2 bg-slate-950">
          {/* Top-Left: Original */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center group">
            <img src={originalImage} alt="Original Room" className="w-full h-full object-contain" />
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/90 text-[10px] font-mono font-bold text-slate-300 border border-slate-700">
              1. Original Room
            </span>
          </div>

          {/* Top-Right: SAM 3 Mask */}
          <div className="relative rounded-xl overflow-hidden border border-purple-500/30 bg-slate-900 flex items-center justify-center group">
            {hasMask ? (
              <img src={compositeMaskBase64} alt="SAM 3 Mask" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center p-2 text-xs text-slate-400">No mask yet. Click Detect.</div>
            )}
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-purple-950/90 text-[10px] font-mono font-bold text-purple-300 border border-purple-500/40">
              2. SAM 3 Neural Mask
            </span>
          </div>

          {/* Bottom-Left: Tiled Room Render */}
          <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-900 flex items-center justify-center group">
            {hasRender ? (
              <img src={renderedImageBase64} alt="Tiled Room" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center p-2 text-xs text-slate-400">No render yet. Click Render.</div>
            )}
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-950/90 text-[10px] font-mono font-bold text-emerald-300 border border-emerald-500/40">
              3. Photorealistic Tiled Room
            </span>
          </div>

          {/* Bottom-Right: Split Slider */}
          <div className="relative rounded-xl overflow-hidden border border-indigo-500/30 bg-slate-900 flex items-center justify-center">
            {hasRender ? (
              <ComparisonSlider
                originalImage={originalImage}
                renderedImage={renderedImageBase64}
                splitPosition={splitPosition}
                onSplitChange={setSplitPosition}
              />
            ) : (
              <div className="text-center p-2 text-xs text-slate-400">Click Render for Split Slider</div>
            )}
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-indigo-950/90 text-[10px] font-mono font-bold text-indigo-300 border border-indigo-500/40 z-30">
              4. Interactive Split Slider
            </span>
          </div>
        </div>
      );
    }

    // 2. Split Slider Mode
    if (viewMode === "split") {
      if (hasRender) {
        return (
          <ComparisonSlider
            originalImage={originalImage}
            renderedImage={renderedImageBase64}
            splitPosition={splitPosition}
            onSplitChange={setSplitPosition}
          />
        );
      }
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={originalImage}
            alt="Original Room"
            className="w-full h-full object-contain"
          />
          <div className="absolute bottom-4 inset-x-4 mx-auto max-w-md bg-slate-950/90 border border-slate-700/80 backdrop-blur-xl px-4 py-2 rounded-xl text-center shadow-2xl flex items-center justify-center gap-2 text-xs text-slate-300">
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Select a tile & click <strong>✨ Render Tiles</strong> to enable Split Comparison</span>
          </div>
        </div>
      );
    }

    // 3. Tiled Room Render Mode
    if (viewMode === "rendered") {
      if (hasRender) {
        return (
          <img
            src={renderedImageBase64}
            alt="Rendered Tiled Room"
            className="w-full h-full object-contain transition-transform duration-200"
            style={{ transform: isLargeScreen ? `scale(${zoomLevel})` : "none" }}
          />
        );
      }
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={originalImage}
            alt="Original Room"
            className="w-full h-full object-contain opacity-50"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <Sparkles className="w-8 h-8 text-emerald-400 animate-bounce" />
            <p className="text-sm font-bold text-white">No Render Generated Yet</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Click <strong>&quot;✨ Render Tiles onto Room&quot;</strong> in Section 4 to synthesize realistic tiles.
            </p>
          </div>
        </div>
      );
    }

    // 4. SAM 3 Mask Overlay Mode
    if (viewMode === "mask") {
      if (hasMask) {
        return (
          <img
            src={compositeMaskBase64}
            alt="SAM 3 Mask Overlay"
            className="w-full h-full object-contain transition-transform duration-200"
            style={{ transform: isLargeScreen ? `scale(${zoomLevel})` : "none" }}
          />
        );
      }
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={originalImage}
            alt="Original Room"
            className="w-full h-full object-contain opacity-50"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <Layers className="w-8 h-8 text-purple-400 animate-pulse" />
            <p className="text-sm font-bold text-white">No Surface Detected Yet</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Click <strong>&quot;⚡ Detect Surface (SAM 3)&quot;</strong> in Section 2 to segment the {surfaceType}.
            </p>
          </div>
        </div>
      );
    }

    // 5. Default: Original View
    return (
      <img
        src={originalImage}
        alt="Original Room Photo"
        className="w-full h-full object-contain transition-transform duration-200"
        style={{ transform: isLargeScreen ? `scale(${zoomLevel})` : "none" }}
      />
    );
  };

  return (
    <>
      {/* STANDARD INLINE CANVAS */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 p-4 shadow-xl backdrop-blur-xl space-y-3 flex flex-col">
        {/* Top Header & Mode Toggle Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-white">
              Dual-Pane Surface Visualizer
            </span>
            {hasRender && (
              <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                {engineLabels[blendingMode] || blendingMode}
              </span>
            )}
            {executionTimeMs > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-sky-400 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />
                <span>{executionTimeMs}ms</span>
              </span>
            )}
          </div>

          {/* View Mode Switcher Pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/90 border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "split"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split Slider</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("rendered")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "rendered"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tiled Room</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("original")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "original"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Original</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("mask")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "mask"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>SAM 3 Mask</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("quad")}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "quad"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="4-Way Simultaneous Comparison"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>4-Way View</span>
            </button>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="relative flex-1 min-h-[440px] max-h-[560px] w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
          {renderCanvasContent(false)}

          {/* Quick Expand Button on Top-Right Corner of Canvas */}
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="absolute top-3 right-3 z-30 p-2 rounded-xl bg-slate-950/80 hover:bg-indigo-600 text-white border border-white/20 backdrop-blur-md transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Expand into Large Screen View"
          >
            <Maximize2 className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline font-bold">Large Screen</span>
          </button>
        </div>

        {/* Bottom Footer Actions & Status Message */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-semibold text-slate-400">Status:</span>
            <span className="text-slate-200 font-medium truncate max-w-[400px]">
              {statusMessage}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Large Screen</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!originalImage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Download (HD)</span>
            </button>
          </div>
        </div>
      </div>

      {/* FULLSCREEN LARGE SCREEN MODAL LIGHTBOX */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col p-3 sm:p-5 animate-in fade-in duration-200">
          {/* Fullscreen Header */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>✨ Large Screen Room Visualizer</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    {engineLabels[blendingMode] || blendingMode}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 capitalize">
                  Surface: <strong>{surfaceType}</strong> &bull; Tile: <strong>{selectedTileName}</strong>
                </p>
              </div>
            </div>

            {/* View Mode Selector in Fullscreen (All 5 Modes Available) */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "split" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                <Columns className="w-4 h-4" />
                <span className="hidden sm:inline">Split Slider</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("rendered")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "rendered" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Tiled Room</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("original")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "original" ? "bg-slate-700 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Original</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("mask")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "mask" ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">SAM 3 Mask</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("quad")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "quad" ? "bg-amber-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
                title="4-Way Simultaneous Comparison"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">4-Way View</span>
              </button>
            </div>

            {/* Controls & Close Button */}
            <div className="flex items-center gap-2">
              {viewMode !== "split" && viewMode !== "quad" && (
                <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono font-bold text-slate-300 px-2">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-white border border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Download</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsFullscreen(false);
                  setZoomLevel(1);
                }}
                className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/40 transition-all active:scale-95 cursor-pointer"
                title="Close Fullscreen (Esc)"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Fullscreen Canvas Content */}
          <div className="flex-1 w-full h-full min-h-0 relative flex items-center justify-center overflow-hidden my-2 rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            {renderCanvasContent(true)}
          </div>

          {/* Fullscreen Footer */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>Press <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-white text-[10px]">Esc</kbd> to exit large screen</span>
            <span className="truncate max-w-[500px]">{statusMessage}</span>
          </div>
        </div>
      )}
    </>
  );
}

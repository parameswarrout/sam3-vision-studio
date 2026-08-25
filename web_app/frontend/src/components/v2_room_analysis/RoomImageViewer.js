"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Layers,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Columns,
  Download,
  Sliders,
} from "lucide-react";

export function RoomImageViewer({
  imageUrl,
  regions = [],
  visibleRegions,
  hoveredRegionId,
  onHoverRegion,
}) {
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // 1. Viewer View & Opacity State
  const [overlayOpacity, setOverlayOpacity] = useState(65);
  const [viewMode, setViewMode] = useState("overlay"); // 'overlay' | 'split'
  const [splitPos, setSplitPos] = useState(50); // 0% to 100%
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // 2. Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(4, Math.round((z + 0.3) * 10) / 10));
  const handleZoomOut = () => setZoom((z) => Math.max(1, Math.round((z - 0.3) * 10) / 10));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Wheel zoom handler
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoom((prevZoom) => {
      const nextZoom = Math.min(4, Math.max(1, Math.round((prevZoom + delta) * 10) / 10));
      if (nextZoom === 1) setPan({ x: 0, y: 0 });
      return nextZoom;
    });
  };

  // Pan drag handlers
  const handleMouseDown = (e) => {
    if (viewMode === "split" && e.target.dataset.splitHandle) return;
    if (zoom > 1) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning && zoom > 1) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }

    if (isDraggingSplit && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const posPercent = Math.min(95, Math.max(5, ((clientX - rect.left) / rect.width) * 100));
      setSplitPos(posPercent);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingSplit(false);
  };

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // One-click Composite Image Download
  const handleDownloadComposite = () => {
    if (!imageUrl) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const baseImg = new Image();
    baseImg.crossOrigin = "anonymous";
    baseImg.onload = async () => {
      canvas.width = baseImg.naturalWidth;
      canvas.height = baseImg.naturalHeight;
      // Draw base image
      ctx.drawImage(baseImg, 0, 0);

      // Draw active visible masks
      for (const region of regions) {
        if (visibleRegions.has(region.id)) {
          const maskImg = new Image();
          await new Promise((resolve) => {
            maskImg.onload = resolve;
            maskImg.src = region.mask_base64;
          });
          ctx.globalAlpha = overlayOpacity / 100.0;
          ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = 1.0;
        }
      }

      const link = document.createElement("a");
      link.download = `segmented_room_${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    baseImg.src = imageUrl;
  };

  if (!imageUrl) return null;

  const hoveredRegion = regions.find((r) => r.id === hoveredRegionId);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`rounded-3xl bg-slate-900/95 backdrop-blur-2xl p-3 sm:p-4 border border-slate-700 shadow-2xl shadow-black/50 flex flex-col gap-2.5 h-full min-h-0 ${
        isFullscreen ? "p-6 bg-slate-950" : ""
      }`}
    >
      {/* 1. Viewer Top Control Bar */}
      <div className="flex items-center justify-between px-1 text-xs shrink-0 flex-wrap gap-2">
        {/* Left: View Mode Toggle & Hovered Indicator */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-950 border border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("overlay")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "overlay"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Overlay</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "split"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Compare</span>
            </button>
          </div>

          {hoveredRegion && (
            <span
              className="text-xs px-2.5 py-0.5 rounded-xl border font-extrabold tracking-tight animate-in fade-in duration-150 truncate shadow-sm hidden sm:inline"
              style={{
                backgroundColor: `${hoveredRegion.color}30`,
                borderColor: hoveredRegion.color,
                color: "#ffffff",
              }}
            >
              {hoveredRegion.label}
            </span>
          )}
        </div>

        {/* Right: Opacity Slider, Zoom Controls, Download & Fullscreen */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Opacity slider */}
          {viewMode === "overlay" && (
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-300 font-mono font-bold hidden sm:inline">
                {overlayOpacity}%
              </span>
              <input
                type="range"
                min="20"
                max="95"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                className="w-16 sm:w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                title="Adjust Overlay Opacity"
              />
            </div>
          )}

          {/* Zoom Group */}
          <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-30"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-extrabold text-slate-300 px-1 select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-30"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            {zoom > 1 && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-indigo-300 hover:text-white hover:bg-indigo-600 transition-all"
                title="Reset Zoom to 100%"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Download Snapshot Button */}
          <button
            type="button"
            onClick={handleDownloadComposite}
            className="w-8 h-8 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all shadow-sm"
            title="Download Composite Segmented Image"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all shadow-sm"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Main Interactive Canvas Frame */}
      <div
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        className={`relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center flex-1 min-h-0 w-full select-none shadow-inner ${
          zoom > 1 ? (isPanning ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
        }`}
      >
        <div
          ref={imageRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isPanning ? "none" : "transform 0.15s ease-out",
          }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {/* Base Room Image */}
          <img
            src={imageUrl}
            alt="Room Scene"
            className="w-full h-full object-contain select-none pointer-events-none"
          />

          {/* Mode A: Overlay Mode (Full Stacked Masks) */}
          {viewMode === "overlay" &&
            regions.map((region) => {
              const isVisible = visibleRegions.has(region.id);
              const isHovered = hoveredRegionId === region.id;

              if (!isVisible) return null;

              const opacityValue = isHovered ? 0.95 : overlayOpacity / 100.0;

              return (
                <img
                  key={region.id}
                  src={region.mask_base64}
                  alt={region.label}
                  style={{ opacity: opacityValue }}
                  className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-all duration-150 ${
                    isHovered ? "brightness-125 saturate-150 filter drop-shadow-lg" : ""
                  }`}
                />
              );
            })}

          {/* Mode B: Split Compare Mode (Draggable Split Clipper) */}
          {viewMode === "split" && (
            <>
              {/* Right Side: Clipped Masked View */}
              <div
                className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
                style={{ clipPath: `inset(0 0 0 ${splitPos}%)` }}
              >
                {regions.map((region) => {
                  const isVisible = visibleRegions.has(region.id);
                  if (!isVisible) return null;

                  return (
                    <img
                      key={region.id}
                      src={region.mask_base64}
                      alt={region.label}
                      style={{ opacity: overlayOpacity / 100.0 }}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />
                  );
                })}
              </div>

              {/* Draggable Vertical Split Divider Handle */}
              <div
                data-split-handle="true"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingSplit(true);
                }}
                style={{ left: `${splitPos}%` }}
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-2xl z-30"
              >
                <div className="w-7 h-7 rounded-full bg-slate-900 border-2 border-white shadow-xl flex items-center justify-center text-white text-[10px] font-black pointer-events-none">
                  ↔
                </div>
              </div>

              {/* Labels */}
              <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-slate-900/80 text-white font-mono text-[10px] font-extrabold border border-white/20 pointer-events-none backdrop-blur-md">
                Original Photo
              </span>
              <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl bg-indigo-900/80 text-indigo-200 font-mono text-[10px] font-extrabold border border-indigo-400/40 pointer-events-none backdrop-blur-md">
                Segmented Surfaces
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

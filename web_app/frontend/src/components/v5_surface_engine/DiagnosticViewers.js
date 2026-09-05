"use client";

import { useState, useRef } from "react";
import { Eye, Grid, Sun, Layers, Sparkles, Crosshair, RefreshCw, ZoomIn } from "lucide-react";

export function DiagnosticViewers({
  originalImage,
  renderedImage,
  diagnostics,
  activeTab,
  onTabChange,
  promptPoints = [],
  onAddPoint,
  onClearPoints,
  detectedMaskOverlay,
  isDetecting,
  onDetectSurface,
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const imageRef = useRef(null);

  const tabs = [
    { id: "render", label: "PBR Master Render", icon: Sparkles },
    { id: "uv_grid", label: "Metric UV Grid (Stage 2)", icon: Grid, b64: diagnostics?.uv_grid_base64 },
    { id: "normals", label: "TBN Normals (Stage 5)", icon: Layers, b64: diagnostics?.normal_map_base64 },
    { id: "shading", label: "Illumination Field (Stage 3)", icon: Sun, b64: diagnostics?.shading_field_base64 },
    { id: "alpha", label: "Alpha Matte Trimap (Stage 1)", icon: Eye, b64: diagnostics?.alpha_matte_base64 },
  ];

  // Handle interactive click on original room photo to set prompt points
  const handleImageClick = (e) => {
    if (!imageRef.current || !onAddPoint) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Left click = positive point (1), Shift+click = negative point (0)
    const label = e.shiftKey ? 0 : 1;
    onAddPoint(x, y, label);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/90 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Diagnostics Tab Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "render" && renderedImage && (
          <span className="text-[11px] font-mono text-indigo-300 font-bold hidden sm:inline">
            Drag slider to compare ‹›
          </span>
        )}
      </div>

      {/* Main Viewport Area */}
      <div className="relative flex-1 min-h-[440px] max-h-[640px] flex items-center justify-center bg-slate-950/95 overflow-hidden select-none p-3">
        {activeTab === "render" && renderedImage ? (
          // Split Before / After Viewer
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative max-w-full max-h-[580px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
              {/* Before (Original) */}
              <img
                src={originalImage}
                alt="Original Room"
                className="max-w-full max-h-[580px] object-contain block"
              />

              {/* After (PBR Rendered) clipped by slider */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
              >
                <img
                  src={renderedImage}
                  alt="V5 PBR Replaced"
                  className="max-w-full max-h-[580px] object-contain block"
                />
              </div>

              {/* Interactive Divider Slider Line */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 flex items-center justify-center shadow-2xl"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center shadow-xl text-xs font-black text-white">
                  ‹›
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ew-resize z-30 w-full h-full"
              />
            </div>
          </div>
        ) : activeTab !== "render" && diagnostics?.[activeTab + "_base64"] ? (
          <div className="max-w-full max-h-full flex flex-col items-center justify-center gap-2">
            <img
              src={diagnostics[activeTab + "_base64"]}
              alt={activeTab}
              className="max-w-full max-h-[580px] object-contain rounded-2xl border border-slate-800 shadow-xl"
            />
          </div>
        ) : (
          // Interactive Original Image Viewport
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <div
              ref={imageRef}
              onClick={handleImageClick}
              className="relative max-w-full max-h-[560px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl cursor-crosshair group"
            >
              {/* Original Room Image */}
              <img
                src={originalImage || "/samples/living_room.jpg"}
                alt="Room Viewport"
                className="max-w-full max-h-[560px] object-contain block"
              />

              {/* Detected Mask Overlay (if available) */}
              {detectedMaskOverlay && (
                <div className="absolute inset-0 pointer-events-none opacity-60 mix-blend-screen">
                  <img
                    src={detectedMaskOverlay}
                    alt="Detected Mask"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Render Interactive Prompt Points */}
              {promptPoints.map((pt, idx) => (
                <div
                  key={idx}
                  className={`absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white shadow-lg pointer-events-none animate-ping-once ${
                    pt.label === 1 ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                  style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                />
              ))}

              {/* Helper overlay tag */}
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-bold text-slate-300 pointer-events-none flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-indigo-400" />
                <span>Click surface to place point • Shift+Click for obstacle</span>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center gap-2 mt-3">
              <button
                disabled={isDetecting}
                onClick={onDetectSurface}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all shadow-sm"
              >
                {isDetecting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Crosshair className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>Auto-Detect Surface Mask</span>
              </button>

              {promptPoints.length > 0 && (
                <button
                  onClick={onClearPoints}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all"
                >
                  Clear Points ({promptPoints.length})
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

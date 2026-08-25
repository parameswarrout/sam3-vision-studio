"use client";

import { useRef, useState } from "react";
import { Sparkles, Layers, Sliders, Eye } from "lucide-react";

export function RoomImageViewer({
  imageUrl,
  regions = [],
  visibleRegions,
  hoveredRegionId,
  onHoverRegion,
}) {
  const containerRef = useRef(null);
  const [overlayOpacity, setOverlayOpacity] = useState(65);

  if (!imageUrl) return null;

  const hoveredRegion = regions.find((r) => r.id === hoveredRegionId);

  return (
    <div className="rounded-3xl bg-slate-900/95 backdrop-blur-2xl p-3 sm:p-4 border border-slate-700 shadow-2xl shadow-black/50 flex flex-col gap-2.5 h-full min-h-0">
      {/* Viewer Header Bar */}
      <div className="flex items-center justify-between px-1 text-xs shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 font-black text-sm text-white tracking-tight shrink-0">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Interactive Surface Overlay</span>
          </div>

          {hoveredRegion && (
            <span
              className="text-xs px-2.5 py-0.5 rounded-xl border font-extrabold tracking-tight animate-in fade-in duration-150 truncate shadow-sm"
              style={{
                backgroundColor: `${hoveredRegion.color}30`,
                borderColor: hoveredRegion.color,
                color: "#ffffff",
              }}
            >
              Hovered: {hoveredRegion.label}
            </span>
          )}
        </div>

        {/* Opacity Control Slider */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs text-slate-200 font-bold font-mono hidden sm:inline">
            Mask Opacity: {overlayOpacity}%
          </span>
          <input
            type="range"
            min="20"
            max="95"
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(Number(e.target.value))}
            className="w-20 sm:w-24 h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-slate-700"
            title="Adjust Mask Opacity"
          />
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-600/30 text-indigo-200 border border-indigo-500/50 font-extrabold shadow-sm">
            {visibleRegions.size} Active
          </span>
        </div>
      </div>

      {/* Main Canvas Frame (Dynamically flexes to fit 100% viewport) */}
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center flex-1 min-h-0 w-full select-none shadow-inner"
      >
        {/* Base Room Image */}
        <img
          src={imageUrl}
          alt="Room Scene"
          className="w-full h-full object-contain select-none"
        />

        {/* Stacked Semantic Mask Overlays */}
        {regions.map((region) => {
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
              className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-all duration-200 ${
                isHovered
                  ? "brightness-125 saturate-150 filter drop-shadow-md"
                  : ""
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

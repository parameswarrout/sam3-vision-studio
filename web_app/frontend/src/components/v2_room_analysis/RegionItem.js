"use client";

import { Eye, EyeOff, ShieldCheck, AlertTriangle, Building2, Grid, Sun, DoorClosed, Armchair, Layers } from "lucide-react";

const TYPE_ICONS = {
  wall: Building2,
  floor: Grid,
  ceiling: Layers,
  window: Sun,
  door: DoorClosed,
  furniture: Armchair,
};

export function RegionItem({
  region,
  isVisible,
  isHovered,
  onToggle,
  onMouseEnter,
  onMouseLeave,
}) {
  if (!region) return null;

  const { id, type = "wall", label = "Surface", confidence, needs_review = false, area_ratio, color = "#3b82f6", quality } = region;
  
  const confPercent = Math.round((confidence !== undefined && confidence !== null ? confidence : 0.90) * 100);
  const areaPercent = Math.round((area_ratio !== undefined && area_ratio !== null ? area_ratio : 0.10) * 100);
  const IconComponent = TYPE_ICONS[type] || Layers;

  const semanticQuality = quality?.semantic !== undefined ? Math.round(quality.semantic * 100) : confPercent;
  const geometryQuality = quality?.geometry !== undefined ? Math.round(quality.geometry * 100) : 90;
  const boundaryQuality = quality?.boundary !== undefined ? Math.round(quality.boundary * 100) : 90;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onToggle}
      className={`relative group overflow-hidden rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
        isVisible
          ? isHovered
            ? "bg-slate-800 border-indigo-400 shadow-xl shadow-indigo-500/10 scale-[1.01]"
            : "bg-slate-900 hover:bg-slate-850 border-slate-700/80 shadow-md"
          : "bg-slate-950/70 border-slate-850 opacity-60 hover:opacity-85"
      }`}
    >
      {/* Left Vertical Color Indicator Strip */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-2 transition-all duration-300 ${
          isVisible ? "opacity-100" : "opacity-40"
        }`}
        style={{ backgroundColor: color }}
      />

      {/* Subtle Glow when hovered */}
      {isHovered && isVisible && (
        <div
          className="absolute inset-0 opacity-15 pointer-events-none transition-opacity blur-xl"
          style={{ backgroundColor: color }}
        />
      )}

      <div className="pl-4 pr-3.5 py-3.5 flex items-center justify-between gap-3 relative z-10">
        {/* Left Side: Type Icon + Label + Quality breakdown */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Icon Badge */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner border border-white/10 transition-transform group-hover:scale-105"
            style={{
              backgroundColor: `${color}25`,
              color: color,
            }}
          >
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white truncate tracking-tight">
                {label}
              </span>

              {/* Uncertainty Warning Badge */}
              {needs_review && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shrink-0">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Review</span>
                </span>
              )}
            </div>

            {/* Quality & Area Metrics Row */}
            <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
              <div className="w-16 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(10, isNaN(areaPercent) ? 20 : areaPercent))}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <span className="text-xs text-slate-200 font-mono font-bold">
                {isNaN(areaPercent) ? 0 : areaPercent}% area
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                • Geo: {geometryQuality}% • Edge: {boundaryQuality}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Confidence Pill & Toggle Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Confidence Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-mono font-extrabold tracking-tight shadow-md ${
              needs_review
                ? "bg-amber-950/80 text-amber-300 border-amber-500/50"
                : confPercent >= 90
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
                : "bg-sky-950/80 text-sky-300 border-sky-500/50"
            }`}
            title={`Semantic: ${semanticQuality}%, Geometry: ${geometryQuality}%, Boundary: ${boundaryQuality}%`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{confPercent}%</span>
          </div>

          {/* Visibility Toggle Eye */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-200 ${
              isVisible
                ? "bg-indigo-600 text-white border-indigo-400 hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700"
            }`}
            title={isVisible ? "Hide Region Mask" : "Show Region Mask"}
          >
            {isVisible ? (
              <Eye className="w-4 h-4 transition-transform" />
            ) : (
              <EyeOff className="w-4 h-4 transition-transform" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

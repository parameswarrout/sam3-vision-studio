"use client";

import { useState } from "react";
import { Sliders, RotateCw, Box, Layers, ShieldCheck, Sparkles, Wand2, Compass } from "lucide-react";

export function PBRControlPanel({
  catalog,
  selectedTileId,
  onSelectTile,
  surfaceType,
  onChangeSurfaceType,
  customPrompt,
  onChangeCustomPrompt,
  scale,
  onChangeScale,
  rotationDeg,
  onChangeRotation,
  bumpStrength,
  onChangeBumpStrength,
  groutWidthMm,
  onChangeGroutWidth,
  seamBlendRadius,
  onChangeSeamBlendRadius,
  applyGeometricFeedback,
  onToggleGeometricFeedback,
  isRendering,
  onRender,
  onOpenMetrics,
  hasMetrics,
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "All SKUs" },
    { id: "marble", label: "Marble & Stone" },
    { id: "wood", label: "Wood Plank" },
    { id: "terrazzo", label: "Terrazzo" },
  ];

  const filteredCatalog =
    selectedCategory === "all"
      ? catalog
      : catalog.filter((t) => (t.category || "").toLowerCase() === selectedCategory);

  return (
    <div className="flex flex-col gap-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl h-full overflow-y-auto no-scrollbar">
      {/* Header & Surface Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-extrabold text-sm">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>PBR Pipeline Controls</span>
          </div>
          {hasMetrics && (
            <button
              onClick={onOpenMetrics}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/20 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit Metrics</span>
            </button>
          )}
        </div>

        {/* Target Surface Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800">
          {["floor", "wall", "backsplash"].map((type) => (
            <button
              key={type}
              onClick={() => onChangeSurfaceType(type)}
              className={`py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                surfaceType === type
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* PBR Parameters */}
      <div className="space-y-4 pt-2 border-t border-slate-800">
        {/* Metric Scale Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-indigo-400" /> Metric Scale
            </span>
            <span className="font-mono text-indigo-300 font-extrabold">{scale.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.3"
            max="3.0"
            step="0.05"
            value={scale}
            onChange={(e) => onChangeScale(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* 3D Plane Rotation */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-indigo-400" /> Plane Rotation
            </span>
            <span className="font-mono text-indigo-300 font-extrabold">{rotationDeg}°</span>
          </div>
          <input
            type="range"
            min="-90"
            max="90"
            step="5"
            value={rotationDeg}
            onChange={(e) => onChangeRotation(parseInt(e.target.value))}
            className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Cook-Torrance Normal Bump Strength */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" /> Normal Relief
            </span>
            <span className="font-mono text-purple-300 font-extrabold">{(bumpStrength * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="2.5"
            step="0.1"
            value={bumpStrength}
            onChange={(e) => onChangeBumpStrength(parseFloat(e.target.value))}
            className="w-full accent-purple-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Grout Width (mm) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300">3D Grout Width</span>
            <span className="font-mono text-slate-300 font-extrabold">{groutWidthMm.toFixed(1)} mm</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="10.0"
            step="0.5"
            value={groutWidthMm}
            onChange={(e) => onChangeGroutWidth(parseFloat(e.target.value))}
            className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Geometric Feedback Toggle */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white">Geometry Consistency Filter</p>
            <p className="text-[10px] text-slate-400">Stage 1 & 2 3D feedback outlier rejection</p>
          </div>
          <input
            type="checkbox"
            checked={applyGeometricFeedback}
            onChange={(e) => onToggleGeometricFeedback(e.target.checked)}
            className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Catalog SKU Grid */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white">Authored PBR Materials</span>
          <span className="text-[10px] font-mono text-slate-400">{filteredCatalog.length} SKUs</span>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? "bg-slate-800 text-white border border-slate-600"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* SKU Cards Grid */}
        <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1 no-scrollbar">
          {filteredCatalog.map((tile) => {
            const isSelected = selectedTileId === tile.id;
            return (
              <button
                key={tile.id}
                onClick={() => onSelectTile(tile.id)}
                className={`flex flex-col text-left p-2 rounded-2xl border transition-all ${
                  isSelected
                    ? "bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500/50"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="w-full h-14 rounded-xl overflow-hidden bg-slate-900 mb-1.5 relative">
                  <img
                    src={tile.thumbnail_url || `/tiles/${tile.id}.png`}
                    alt={tile.name}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-white shadow-sm" />
                  )}
                </div>
                <p className="text-[11px] font-extrabold text-white truncate">{tile.name}</p>
                <p className="text-[9px] text-slate-400 font-mono truncate">{tile.material || tile.category}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Action Button */}
      <button
        disabled={isRendering}
        onClick={onRender}
        className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isRendering ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Computing PBR Relighting...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Render PBR Replacement</span>
          </>
        )}
      </button>
    </div>
  );
}

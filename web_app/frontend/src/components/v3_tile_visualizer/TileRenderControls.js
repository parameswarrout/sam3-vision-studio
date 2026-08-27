"use client";

import { useState } from "react";
import { Sliders, Sparkles, Loader2, RotateCw, Sun, Box, Palette, Cpu, Check, Compass, Eye, ShieldCheck } from "lucide-react";

export function TileRenderControls({
  renderOptions,
  setRenderOptions,
  presets,
  onApplyPreset,
  blendingEngines,
  blendingMode,
  setBlendingMode,
  onRender,
  isRendering,
  surfaceType,
  selectedTileId,
  detectedVanishingPoint,
}) {
  const [showV3Pro, setShowV3Pro] = useState(true);

  const groutColors = [
    { name: "Clean White", hex: "#FFFFFF", border: "#E2E8F0" },
    { name: "Silver Grey", hex: "#CBD5E1", border: "#94A3B8" },
    { name: "Charcoal Dark", hex: "#334155", border: "#1E293B" },
    { name: "Warm Sand", hex: "#D6D3D1", border: "#A8A29E" },
    { name: "Brass Gold", hex: "#CA8A04", border: "#A16207" },
    { name: "Forest Emerald", hex: "#064E3B", border: "#047857" },
  ];

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 p-4 shadow-xl backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono text-xs font-black">
            4
          </div>
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            V3.0 PBR Lighting & Perspective Engine
          </h2>
        </div>
        <span className="text-[11px] text-emerald-300 font-mono font-semibold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>V3.0 Neural PBR Active</span>
        </span>
      </div>

      {/* 5 Realism & Blending Engines Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-300 flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-sky-400" />
            <span>Select Shading Algorithm:</span>
          </span>
          <span className="text-[9px] font-mono text-slate-400">
            Compare physics models
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {blendingEngines?.map((eng) => {
            const isSelected = blendingMode === eng.id;
            return (
              <button
                key={eng.id}
                type="button"
                onClick={() => {
                  setBlendingMode(eng.id);
                  setRenderOptions((prev) => ({ ...prev, blending_mode: eng.id }));
                }}
                disabled={isRendering}
                className={`p-2.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between gap-1 ${
                  isSelected
                    ? "border-emerald-400 bg-emerald-950/50 ring-1 ring-emerald-400 shadow-md shadow-emerald-500/10"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black flex items-center gap-1 text-white">
                    <span>{eng.icon}</span>
                    <span className="truncate">{eng.name}</span>
                  </span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                  {eng.desc}
                </p>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[8px] font-bold font-mono uppercase px-1.5 py-0.2 rounded bg-slate-900 text-emerald-300 border border-emerald-500/30">
                    {eng.badge}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    {eng.tag}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1-Click Design Presets Bar */}
      <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
        <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
          Quick Style Presets:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onApplyPreset(p)}
              disabled={isRendering}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-[11px] font-bold text-slate-300 hover:text-white transition-all shrink-0 active:scale-95"
            >
              <span>{p.badge}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* V3.0 PRO PBR & PERSPECTIVE MATRIX PANEL */}
      <div className="bg-gradient-to-r from-slate-950/90 via-indigo-950/20 to-slate-950/90 p-3 rounded-xl border border-indigo-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>V3.0 Photorealism & PBR Parameters:</span>
            </span>
          </div>
          {detectedVanishingPoint && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              VP Snapped: ({detectedVanishingPoint[0]}, {detectedVanishingPoint[1]})
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* RANSAC Vanishing Point Snapping Toggle */}
          <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium flex items-center gap-1">
                <Compass className="w-3 h-3 text-indigo-400" /> RANSAC VP Snapping:
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                setRenderOptions((prev) => ({
                  ...prev,
                  auto_vanishing_point: !prev.auto_vanishing_point,
                }))
              }
              className={`w-full py-1 px-2 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 ${
                renderOptions.auto_vanishing_point
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <span>{renderOptions.auto_vanishing_point ? "✓ Auto-Snapped (VP)" : "Manual Trapezoid"}</span>
            </button>
          </div>

          {/* 3D PBR Bump Normal Strength */}
          <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium flex items-center gap-1">
                <Box className="w-3 h-3 text-purple-400" /> 3D Normal Bump:
              </span>
              <span className="font-mono font-bold text-purple-300">
                {Math.round((renderOptions.pbr_bump_strength ?? 0.5) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={renderOptions.pbr_bump_strength ?? 0.5}
              onChange={(e) =>
                setRenderOptions((prev) => ({
                  ...prev,
                  pbr_bump_strength: parseFloat(e.target.value),
                }))
              }
              className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Schlick Fresnel Window Reflections */}
          <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-400" /> Window Light Bounce:
              </span>
              <span className="font-mono font-bold text-amber-300">
                {Math.round((renderOptions.fresnel_reflection_strength ?? 0.5) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={renderOptions.fresnel_reflection_strength ?? 0.5}
              onChange={(e) =>
                setRenderOptions((prev) => ({
                  ...prev,
                  fresnel_reflection_strength: parseFloat(e.target.value),
                }))
              }
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* 3D Grout Crevices (AO) */}
          <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" /> Grout Crevice AO:
              </span>
              <span className="font-mono font-bold text-emerald-300">
                {Math.round((renderOptions.grout_crevice_depth ?? 0.4) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={renderOptions.grout_crevice_depth ?? 0.4}
              onChange={(e) =>
                setRenderOptions((prev) => ({
                  ...prev,
                  grout_crevice_depth: parseFloat(e.target.value),
                }))
              }
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
        {/* Scale */}
        <div className="space-y-1 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <Box className="w-3 h-3 text-sky-400" /> Tile Scale:
            </span>
            <span className="font-mono font-bold text-sky-300">{renderOptions.scale.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.3"
            max="2.5"
            step="0.1"
            value={renderOptions.scale}
            onChange={(e) =>
              setRenderOptions((prev) => ({ ...prev, scale: parseFloat(e.target.value) }))
            }
            className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Rotation */}
        <div className="space-y-1 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <RotateCw className="w-3 h-3 text-purple-400" /> Layout Angle:
            </span>
            <span className="font-mono font-bold text-purple-300">{renderOptions.rotation_deg}°</span>
          </div>
          <div className="flex items-center gap-1 pt-0.5">
            {[0, 45, 90].map((deg) => (
              <button
                key={deg}
                type="button"
                onClick={() => setRenderOptions((prev) => ({ ...prev, rotation_deg: deg }))}
                className={`flex-1 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
                  renderOptions.rotation_deg === deg
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                {deg === 45 ? "45° Diamond" : `${deg}°`}
              </button>
            ))}
          </div>
        </div>

        {/* Shadow Retention */}
        <div className="space-y-1 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-400" /> Ambient Shadow Blend:
            </span>
            <span className="font-mono font-bold text-amber-300">
              {Math.round(renderOptions.shadow_retention * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.10"
            max="1.00"
            step="0.05"
            value={renderOptions.shadow_retention}
            onChange={(e) =>
              setRenderOptions((prev) => ({
                ...prev,
                shadow_retention: parseFloat(e.target.value),
              }))
            }
            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Glossiness */}
        <div className="space-y-1 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Surface Gloss:
            </span>
            <span className="font-mono font-bold text-emerald-300">
              {Math.round(renderOptions.glossiness * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={renderOptions.glossiness}
            onChange={(e) =>
              setRenderOptions((prev) => ({
                ...prev,
                glossiness: parseFloat(e.target.value),
              }))
            }
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Grout Color Selection & Primary Render Action Button */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">Grout Tint:</span>
          <div className="flex items-center gap-1.5">
            {groutColors.map((gc) => (
              <button
                key={gc.hex}
                type="button"
                onClick={() => setRenderOptions((prev) => ({ ...prev, grout_color: gc.hex }))}
                title={gc.name}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  renderOptions.grout_color === gc.hex
                    ? "ring-2 ring-emerald-400 scale-110 border-white"
                    : "border-slate-700 opacity-70 hover:opacity-100"
                }`}
                style={{ backgroundColor: gc.hex }}
              />
            ))}
          </div>
        </div>

        {/* Master Render Button */}
        <button
          type="button"
          onClick={() => onRender()}
          disabled={isRendering}
          className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 border border-white/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isRendering ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Synthesizing V3.0 PBR Tiles...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-white" />
              <span>✨ Render Tiles onto Room (V3.0)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

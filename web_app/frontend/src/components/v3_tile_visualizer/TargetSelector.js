"use client";

import { Sparkles, Layers, Sliders, Loader2 } from "lucide-react";

export function TargetSelector({
  surfaceType,
  setSurfaceType,
  confidence,
  setConfidence,
  customPrompt,
  setCustomPrompt,
  onDetect,
  isDetecting,
  hasMask,
  numRegions,
}) {
  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 p-4 shadow-xl backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-mono text-xs font-black">
            2
          </div>
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            SAM 3 Surface Grounding
          </h2>
        </div>
        {hasMask && (
          <span className="text-[11px] text-emerald-400 font-mono font-semibold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {numRegions} region(s) detected
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Surface Selection */}
        <div className="space-y-1.5 sm:col-span-1">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
            Target Plane:
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setSurfaceType("floor")}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                surfaceType === "floor"
                  ? "border-emerald-400 bg-emerald-950/60 text-emerald-300 ring-1 ring-emerald-400"
                  : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
              }`}
            >
              <span>🟫 Floor Plane</span>
            </button>

            <button
              type="button"
              onClick={() => setSurfaceType("wall")}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                surfaceType === "wall"
                  ? "border-purple-400 bg-purple-950/60 text-purple-300 ring-1 ring-purple-400"
                  : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
              }`}
            >
              <span>🧱 Wall / Backsplash</span>
            </button>
          </div>
        </div>

        {/* Confidence Threshold */}
        <div className="space-y-1.5 sm:col-span-1 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-medium">SAM 3 Sensitivity:</span>
            <span className="font-mono font-bold text-sky-400">{(confidence * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.02"
            max="0.40"
            step="0.02"
            value={confidence}
            onChange={(e) => setConfidence(parseFloat(e.target.value))}
            className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[9px] text-slate-400 block leading-none">
            Lower = detects wider floor area; Higher = tightest boundary
          </span>
        </div>

        {/* Custom Prompt & Trigger Button */}
        <div className="space-y-1.5 sm:col-span-1 flex flex-col justify-between">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Custom Prompt:</span>
              <span className="text-[9px] font-normal text-slate-400">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. hardwood floor, shower tile"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        type="button"
        onClick={onDetect}
        disabled={isDetecting}
        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 border border-white/10 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isDetecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Executing SAM 3 Grounding & Obstacle Carving...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-sky-300" />
            <span>⚡ Detect Surface (SAM 3)</span>
          </>
        )}
      </button>
    </div>
  );
}

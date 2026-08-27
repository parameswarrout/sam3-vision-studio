"use client";

import { Sparkles, Loader2, Layers, Sliders, CheckCircle2 } from "lucide-react";

export function TargetSelector({
  surfaceType,
  setSurfaceType,
  confidence,
  setConfidence,
  customPrompt,
  setCustomPrompt,
  onDetect,
  isDetecting,
  surfaceMasks,
  executionTimeMs,
}) {
  const surfaces = [
    {
      id: "floor",
      label: "Floor Surface",
      icon: "🛋️",
      desc: "Hardwood, marble tiles, parquet, carpet flooring",
      badge: "Flooring",
      color: "from-sky-600 to-indigo-600",
    },
    {
      id: "wall",
      label: "Wall Planes",
      icon: "🧱",
      desc: "Backsplash, accent wall, bathroom wall tiling",
      badge: "Walls",
      color: "from-purple-600 to-indigo-600",
    },
    {
      id: "both",
      label: "Floor & Walls",
      icon: "🔲",
      desc: "Full interior room surface remodel",
      badge: "Full Room",
      color: "from-emerald-600 to-teal-600",
    },
  ];

  const hasDetected = surfaceMasks && surfaceMasks.length > 0;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 p-4 shadow-xl backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-mono text-xs font-black">
            2
          </div>
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            Choose Target Surface & Detect (SAM 3)
          </h2>
        </div>
        {hasDetected && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
            <CheckCircle2 className="w-3 h-3" />
            <span>{surfaceMasks.length} Region(s) Ready</span>
          </span>
        )}
      </div>

      {/* Surface Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {surfaces.map((s) => {
          const isSelected = surfaceType === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSurfaceType(s.id)}
              className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between gap-1.5 ${
                isSelected
                  ? `border-sky-400 bg-gradient-to-br ${s.color}/20 ring-1 ring-sky-400 shadow-md shadow-sky-500/10`
                  : "border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-850"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{s.icon}</span>
                <span
                  className={`text-[9px] font-bold font-mono uppercase px-1.5 py-0.2 rounded ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {s.badge}
                </span>
              </div>
              <div>
                <p className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-200"}`}>
                  {s.label}
                </p>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{s.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Advanced Tuning Accordion / Slider */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Confidence Threshold */}
        <div className="w-full sm:w-1/2 flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-300 shrink-0">
            SAM 3 Confidence: <strong className="font-mono text-sky-400">{confidence.toFixed(2)}</strong>
          </span>
          <input
            type="range"
            min="0.02"
            max="0.40"
            step="0.02"
            value={confidence}
            onChange={(e) => setConfidence(parseFloat(e.target.value))}
            className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Primary Detect Button */}
        <button
          type="button"
          onClick={onDetect}
          disabled={isDetecting}
          className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 border border-white/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {isDetecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Segmenting with SAM 3...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-sky-200" />
              <span>⚡ Detect {surfaceType.toUpperCase()} (SAM 3)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

"use client";

import { PlusCircle, MinusCircle, Undo, Trash2, MousePointerClick } from "lucide-react";
import { CLICK_MODES } from "@/lib/constants";

export function PointPromptTab({
  points,
  clickMode,
  setClickMode,
  onUndo,
  onClear,
  isLoading,
  hasImage,
}) {
  const posCount = points.filter((p) => p.label === CLICK_MODES.POSITIVE).length;
  const negCount = points.filter((p) => p.label === CLICK_MODES.NEGATIVE).length;

  return (
    <div className="space-y-5">
      {/* 1. Instructions / Mode Indicator */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-200 flex items-center gap-1.5">
          <MousePointerClick className="w-3.5 h-3.5 text-indigo-400" />
          Interactive Canvas Clicking
        </p>
        <p>
          Click anywhere on the image on the left. Green clicks add mask parts, Red clicks subtract background.
        </p>
      </div>

      {/* 2. Mode Selector Buttons */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Select Click Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {/* Positive Mode */}
          <button
            type="button"
            disabled={!hasImage}
            onClick={() => setClickMode(CLICK_MODES.POSITIVE)}
            className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
              clickMode === CLICK_MODES.POSITIVE
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20"
                : "bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Positive (+)</span>
          </button>

          {/* Negative Mode */}
          <button
            type="button"
            disabled={!hasImage}
            onClick={() => setClickMode(CLICK_MODES.NEGATIVE)}
            className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
              clickMode === CLICK_MODES.NEGATIVE
                ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-lg shadow-rose-500/10 ring-2 ring-rose-500/20"
                : "bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            <MinusCircle className="w-4 h-4 text-rose-400" />
            <span>Negative (-)</span>
          </button>
        </div>
      </div>

      {/* 3. Point Counters */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <span className="text-slate-400">Active Points:</span>
        <div className="flex items-center gap-2 font-mono">
          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            +{posCount} Pos
          </span>
          <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
            -{negCount} Neg
          </span>
        </div>
      </div>

      {/* 4. Undo and Clear Controls */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={isLoading || points.length === 0}
          className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Undo className="w-3.5 h-3.5" />
          <span>Undo Point</span>
        </button>

        <button
          type="button"
          onClick={onClear}
          disabled={isLoading || points.length === 0}
          className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>
    </div>
  );
}

"use client";

import { Loader2, Clock, CheckCircle2, Layers, Cpu, Sparkles } from "lucide-react";

export function AnalysisProgress({ progressPercent, progressStage, elapsedSeconds }) {
  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl glass-panel p-6 border border-indigo-500/30 shadow-2xl space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider block">
              Autonomous Room Analysis
            </span>
            <p className="text-sm font-semibold text-white">
              {progressStage || "Processing room geometry..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-indigo-300 font-bold">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Subtle Progress Bar */}
      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-300 rounded-full shadow-sm"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Progressive Stage Breakdown */}
      <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 text-slate-400">
        <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${progressPercent >= 30 ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" : "bg-slate-900/40 border-slate-800"}`}>
          <Layers className="w-3.5 h-3.5" />
          <span className="truncate">1. Candidates</span>
        </div>
        <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${progressPercent >= 70 ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" : progressPercent >= 30 ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30 animate-pulse" : "bg-slate-900/40 border-slate-800"}`}>
          <Cpu className="w-3.5 h-3.5" />
          <span className="truncate">2. Surfaces</span>
        </div>
        <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${progressPercent >= 100 ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" : progressPercent >= 70 ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30 animate-pulse" : "bg-slate-900/40 border-slate-800"}`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span className="truncate">3. Refinement</span>
        </div>
      </div>
    </div>
  );
}

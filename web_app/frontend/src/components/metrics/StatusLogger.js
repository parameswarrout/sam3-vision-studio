"use client";

import { Activity, Clock, CheckCircle2, AlertCircle, Info } from "lucide-react";

export function StatusLogger({ statusLog }) {
  const isSuccess = statusLog.type === "success";
  const isError = statusLog.type === "error";

  return (
    <div className="rounded-2xl glass-panel p-4 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
      {/* Left: Message Log */}
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isSuccess
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : isError
              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : isError ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Info className="w-4 h-4" />
          )}
        </div>
        <div>
          <span className="font-semibold text-slate-200 block">Execution Status:</span>
          <p className="text-slate-400">{statusLog.message}</p>
        </div>
      </div>

      {/* Right: Metrics */}
      <div className="flex items-center gap-3 self-end sm:self-center font-mono">
        {statusLog.numObjects > 0 && (
          <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <span className="text-slate-500">Found:</span>
            <strong className="text-emerald-400">{statusLog.numObjects}</strong>
          </div>
        )}

        {statusLog.timeMs !== null && (
          <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{statusLog.timeMs} ms</span>
          </div>
        )}
      </div>
    </div>
  );
}

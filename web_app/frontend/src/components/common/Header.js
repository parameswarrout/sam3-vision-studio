"use client";

import { Layers, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "./Badge";
import { DeviceSelector } from "./DeviceSelector";

export function Header({
  health,
  isOnline,
  onSwitchDevice,
  isSwitchingDevice,
}) {
  const isModelLoaded = Boolean(health?.model_loaded);

  return (
    <header className="border-b border-white/5 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-[1px] flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">SAM 3</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-medium border border-indigo-500/30">
                STUDIO
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Meta Segment Anything 3 • Decoupled Next.js + FastAPI
            </p>
          </div>
        </div>

        {/* Right: Health, Model Status & Hardware Switcher */}
        <div className="flex items-center gap-3">
          {/* Model Loading State Badge */}
          {isOnline && !isModelLoaded ? (
            <Badge variant="warning" className="animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Loading SAM 3 Weights (~10-15s)...</span>
            </Badge>
          ) : isOnline && isModelLoaded ? (
            <Badge variant="success">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Model Ready</span>
            </Badge>
          ) : (
            <Badge variant="danger">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Backend Offline</span>
            </Badge>
          )}

          {/* Interactive Hardware Compute Target Selector */}
          <DeviceSelector
            currentDevice={health?.device || "cuda"}
            cudaAvailable={health?.cuda_available ?? false}
            isOnline={isOnline}
            onSwitchDevice={onSwitchDevice}
            isSwitching={isSwitchingDevice}
          />
        </div>
      </div>
    </header>
  );
}

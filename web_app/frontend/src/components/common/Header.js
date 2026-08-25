"use client";

import Link from "next/link";
import { Layers, Loader2, CheckCircle2, Wand2, Home } from "lucide-react";
import { Badge } from "./Badge";
import { DeviceSelector } from "./DeviceSelector";

export function Header({
  health,
  isOnline,
  onSwitchDevice,
  isSwitchingDevice,
  activeNav = "manual",
}) {
  const isModelLoaded = Boolean(health?.model_loaded);

  return (
    <header className="border-b border-white/5 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3 shrink-0">
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

        {/* Center: Main Navigation Tabs (V1 vs V2) */}
        <nav className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-inner">
          <Link
            href="/"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeNav === "manual"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Manual Prompting</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase font-black ${
              activeNav === "manual" ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
            }`}>
              V1
            </span>
          </Link>

          <Link
            href="/room-analysis"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeNav === "room-analysis"
                ? "bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Room Analysis</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase font-black ${
              activeNav === "room-analysis" ? "bg-white/25 text-white" : "bg-slate-800 text-indigo-400 border border-indigo-500/30"
            }`}>
              V2
            </span>
          </Link>
        </nav>

        {/* Right: Health, Model Status & Hardware Switcher */}
        <div className="flex items-center gap-3 shrink-0">
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

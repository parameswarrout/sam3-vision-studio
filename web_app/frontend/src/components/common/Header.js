"use client";

import Link from "next/link";
import { Layers, Loader2, CheckCircle2, Wand2, Home, Sparkles, Cpu } from "lucide-react";
import { Badge } from "./Badge";
import { DeviceSelector } from "./DeviceSelector";

// Meta AI Infinite Loop SVG Icon
function MetaLogo({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6.98 5.75C4.22 5.75 2 7.97 2 10.73c0 3.32 3.19 6.84 8.78 10.97.7.52 1.74.52 2.44 0C18.81 17.57 22 14.05 22 10.73c0-2.76-2.22-4.98-4.98-4.98-1.89 0-3.57 1.05-4.42 2.65-.25.47-.95.47-1.2 0-.85-1.6-2.53-2.65-4.42-2.65Z"
        fill="url(#meta-grad)"
      />
      <defs>
        <linearGradient id="meta-grad" x1="2" y1="5.75" x2="22" y2="21.7" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0081FB" />
          <stop offset="0.5" stopColor="#0064E0" />
          <stop offset="1" stopColor="#8A3FFC" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Header({
  health,
  isOnline,
  onSwitchDevice,
  isSwitchingDevice,
  activeNav = "manual",
}) {
  const isModelLoaded = Boolean(health?.model_loaded);

  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-50 shadow-md">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-10 h-10 rounded-2xl bg-slate-900 border border-white/15 flex items-center justify-center shadow-inner">
              <MetaLogo className="w-6 h-6" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                SAM 3
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-indigo-200 font-mono font-extrabold border border-indigo-500/40 shadow-sm">
                VISION STUDIO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:flex items-center gap-1.5 mt-0.5">
              <span>Meta AI Foundation</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span className="text-slate-300">Decoupled Fast Architecture</span>
            </p>
          </div>
        </div>

        {/* Center: Main Navigation Tabs (V1 vs V2) */}
        <nav className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-inner">
          <Link
            href="/"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeNav === "manual"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-1 ring-indigo-400"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-300" />
            <span>Manual Prompting</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase font-black ${
                activeNav === "manual" ? "bg-white/25 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              V1
            </span>
          </Link>

          <Link
            href="/room-analysis"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeNav === "room-analysis"
                ? "bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 text-white shadow-md shadow-indigo-600/40 ring-1 ring-sky-400"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Home className="w-3.5 h-3.5 text-sky-300" />
            <span>Room Analysis</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase font-black ${
                activeNav === "room-analysis"
                  ? "bg-white/30 text-white"
                  : "bg-slate-800 text-indigo-300 border border-indigo-500/30"
              }`}
            >
              V2
            </span>
          </Link>
        </nav>

        {/* Right: Server / Compute Device Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <DeviceSelector
            currentDevice={health?.device}
            isOnline={isOnline}
            onSwitchDevice={onSwitchDevice}
            isSwitching={isSwitchingDevice}
          />

          {/* Model Status Pill */}
          <div className="hidden md:flex items-center gap-2">
            {isOnline ? (
              isModelLoaded ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>CUDA Ready</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading Weights</span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Backend Offline</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

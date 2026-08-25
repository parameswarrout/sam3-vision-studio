"use client";

import Link from "next/link";
import { Layers, Loader2, CheckCircle2, Wand2, Home, Sparkles, Cpu } from "lucide-react";
import { Badge } from "./Badge";
import { DeviceSelector } from "./DeviceSelector";

// Futuristic AI Vision Transformer & Neural Segmentation Matrix Logo
function VisionTransformerLogo({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      {/* Outer Vision Aperture Frame */}
      <rect
        x="3"
        y="3"
        width="26"
        height="26"
        rx="8"
        stroke="url(#vt-grad-frame)"
        strokeWidth="1.75"
        strokeDasharray="4 2"
        className="opacity-70"
      />

      {/* 4 Corner Optical Focus Crosshairs */}
      <path d="M7 11V7H11" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 7H25V11" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 21V25H21" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 25H7V21" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Vision Transformer Neural Patch Matrix (3x3 Token Grid) */}
      <rect x="9" y="9" width="3.5" height="3.5" rx="1" fill="#6366F1" />
      <rect x="14.25" y="9" width="3.5" height="3.5" rx="1" fill="#818CF8" />
      <rect x="19.5" y="9" width="3.5" height="3.5" rx="1" fill="#6366F1" />

      <rect x="9" y="14.25" width="3.5" height="3.5" rx="1" fill="#818CF8" />
      {/* Central Transformer Attention Node (Glowing Core) */}
      <rect x="13.75" y="13.75" width="4.5" height="4.5" rx="1.5" fill="url(#vt-core-grad)" />
      <rect x="19.5" y="14.25" width="3.5" height="3.5" rx="1" fill="#818CF8" />

      <rect x="9" y="19.5" width="3.5" height="3.5" rx="1" fill="#6366F1" />
      <rect x="14.25" y="19.5" width="3.5" height="3.5" rx="1" fill="#818CF8" />
      <rect x="19.5" y="19.5" width="3.5" height="3.5" rx="1" fill="#6366F1" />

      {/* Gradients */}
      <defs>
        <linearGradient id="vt-grad-frame" x1="3" y1="3" x2="29" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="0.5" stopColor="#6366F1" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id="vt-core-grad" x1="13.75" y1="13.75" x2="18.25" y2="18.25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#FFFFFF" />
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
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 rounded-2xl blur-sm opacity-70 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-10 h-10 rounded-2xl bg-slate-950 border border-indigo-500/40 flex items-center justify-center shadow-inner">
              <VisionTransformerLogo className="w-7 h-7" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                SAM 3
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-600/30 to-sky-600/30 text-sky-200 font-mono font-extrabold border border-sky-500/40 shadow-sm">
                VISION TRANSFORMER
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:flex items-center gap-1.5 mt-0.5">
              <span>Meta Vision Foundation</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span className="text-slate-300">Fast Neural Engine</span>
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

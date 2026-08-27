"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Layers,
  Loader2,
  CheckCircle2,
  Wand2,
  Home,
  Sparkles,
  Cpu,
  History,
  User,
  LogOut,
  LogIn,
  Shield,
  ChevronDown,
  UserPlus,
  Activity,
} from "lucide-react";
import { Badge } from "./Badge";
import { DeviceSelector } from "./DeviceSelector";
import { AuthModal } from "./AuthModal";
import { useAuth } from "@/hooks/useAuth";

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
  onOpenHistory,
}) {
  const isModelLoaded = Boolean(health?.model_loaded);
  const { user, isAuthenticated, login, register, logout, switchDemoRole } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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

        {/* Center: Main Navigation Tabs (V1, V2 & Admin) */}
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

          {/* V2.5 Tile Visualizer Tab */}
          <Link
            href="/tile-visualizer"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeNav === "tile-visualizer"
                ? "bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-500 text-white shadow-md shadow-emerald-600/40 ring-1 ring-emerald-400"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Tile Visualizer</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase font-black ${
                activeNav === "tile-visualizer"
                  ? "bg-white/30 text-white"
                  : "bg-slate-800 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              V2.5
            </span>
          </Link>

          {/* Admin Navigation Tab */}
          <Link
            href="/admin"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeNav === "admin"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/40 ring-1 ring-purple-400"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-300" />
            <span>Admin</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase font-black ${
                activeNav === "admin"
                  ? "bg-white/30 text-white"
                  : "bg-slate-800 text-purple-300 border border-purple-500/30"
              }`}
            >
              LOGS
            </span>
          </Link>
        </nav>

        {/* Right: History, Device, Model Status & Prominent Sign In */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* History Button (Opens SQLite Saved Rooms Drawer) */}
          {activeNav === "room-analysis" && onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all shadow-sm active:scale-95"
              title="Open Saved Room Analyses History"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">History</span>
            </button>
          )}

          <DeviceSelector
            currentDevice={health?.device}
            isOnline={isOnline}
            onSwitchDevice={onSwitchDevice}
            isSwitching={isSwitchingDevice}
          />

          {/* Model Status Pill */}
          <div className="hidden lg:flex items-center gap-2">
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

          {/* Prominent Direct Sign In / Sign Up Button or User Profile */}
          {!isAuthenticated ? (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all active:scale-95 border border-white/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white transition-all shadow-md active:scale-95 group"
                title="User profile & auth settings"
              >
                {/* Photo Avatar with Online Badge */}
                <div className="relative">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-7 h-7 rounded-full object-cover border border-indigo-400 shadow-sm group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center text-white text-[11px] font-black shadow-inner">
                      {user.full_name ? user.full_name[0].toUpperCase() : "U"}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                </div>

                <div className="hidden sm:flex flex-col items-start text-left">
                  <span className="text-[12px] font-black tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                    {user.full_name || "PA"}
                  </span>
                  <span className="text-[9px] font-mono text-indigo-400 font-extrabold uppercase -mt-0.5">
                    {user.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                  className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-slate-900/95 border border-slate-700/90 shadow-2xl shadow-black/80 backdrop-blur-2xl p-2.5 z-[60] flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="p-2 border-b border-slate-800 flex items-center gap-3">
                    {user.avatar_url && (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500 shadow-md shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-extrabold text-sm text-white truncate">{user.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{user.email || "pa (Local Admin)"}</p>
                      <span className="inline-block text-[9px] font-mono font-bold uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded mt-0.5">
                        {user.role} Active
                      </span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <Link
                      href="/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold text-purple-300 hover:bg-purple-950/40 flex items-center justify-between transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-purple-400" />
                        <span>Admin Audit Center</span>
                      </span>
                      <span className="text-[10px] px-1 rounded bg-purple-500/20 font-mono">🛡️</span>
                    </Link>

                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500 px-2 pt-1 block">
                      Quick Role Switch:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoRole("admin");
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                        user.role === "admin" ? "bg-indigo-600/30 text-indigo-200" : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span>Lead Architect (Admin)</span>
                      {user.role === "admin" && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        switchDemoRole("client");
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                        user.role === "client" ? "bg-indigo-600/30 text-indigo-200" : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span>Client (View-Only)</span>
                      {user.role === "client" && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={login}
        onRegister={register}
      />
    </header>
  );
}

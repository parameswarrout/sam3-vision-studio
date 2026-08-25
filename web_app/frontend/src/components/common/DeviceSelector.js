"use client";

import { useState } from "react";
import { Cpu, Zap, AlertTriangle, Loader2, ChevronDown, Check } from "lucide-react";

export function DeviceSelector({
  currentDevice = "cuda",
  cudaAvailable = true,
  isOnline = true,
  onSwitchDevice,
  isSwitching = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isCuda = currentDevice?.toLowerCase() === "cuda";

  const handleSelect = async (dev) => {
    if (dev === currentDevice || isSwitching || !isOnline) return;
    setIsOpen(false);
    await onSwitchDevice(dev);
  };

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/50">
        <Cpu className="w-3.5 h-3.5" />
        <span>Hardware Offline</span>
      </div>
    );
  }

  // 1. If CUDA GPU is NOT available on the system
  if (!cudaAvailable) {
    return (
      <div className="flex items-center gap-2">
        {/* Active CPU Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
          <Cpu className="w-3.5 h-3.5 text-sky-400" />
          <span>CPU Mode</span>
        </div>

        {/* GPU Not Available Notice */}
        <div
          title="No NVIDIA CUDA GPU detected on backend"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20"
        >
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          <span>GPU Not Available</span>
        </div>
      </div>
    );
  }

  // 2. If CUDA GPU IS available: Show interactive selector
  return (
    <div className="relative">
      <button
        type="button"
        disabled={isSwitching}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ${
          isCuda
            ? "bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border-indigo-500/40 shadow-indigo-500/10"
            : "bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700"
        } ${isSwitching ? "opacity-75 cursor-wait" : "cursor-pointer"}`}
      >
        {isSwitching ? (
          <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
        ) : isCuda ? (
          <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
        ) : (
          <Cpu className="w-3.5 h-3.5 text-sky-400" />
        )}

        <span>
          {isSwitching
            ? "Switching Device..."
            : isCuda
            ? "NVIDIA CUDA (GPU)"
            : "CPU Mode"}
        </span>

        {!isSwitching && <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !isSwitching && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel p-2 z-50 border border-white/10 shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Select Compute Target
            </div>

            {/* CUDA GPU Option */}
            <button
              type="button"
              onClick={() => handleSelect("cuda")}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                isCuda
                  ? "bg-indigo-500/20 text-indigo-200 border border-indigo-500/30"
                  : "text-slate-300 hover:bg-slate-800/80"
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="block font-bold">NVIDIA CUDA (GPU)</span>
                  <span className="text-[10px] text-emerald-400/80 font-normal">
                    Hardware Accelerated (Recommended)
                  </span>
                </div>
              </div>
              {isCuda && <Check className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* CPU Mode Option */}
            <button
              type="button"
              onClick={() => handleSelect("cpu")}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                !isCuda
                  ? "bg-indigo-500/20 text-indigo-200 border border-indigo-500/30"
                  : "text-slate-300 hover:bg-slate-800/80"
              }`}
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="block font-bold">CPU Execution</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Standard processor execution
                  </span>
                </div>
              </div>
              {!isCuda && <Check className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

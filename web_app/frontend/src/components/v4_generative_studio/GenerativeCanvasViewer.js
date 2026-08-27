"use client";

import { useState } from "react";
import { ComparisonSlider } from "./ComparisonSlider";
import {
  Maximize2,
  Minimize2,
  Download,
  Eye,
  Sparkles,
  Sliders,
  Clock,
  CheckCircle2,
} from "lucide-react";

export function GenerativeCanvasViewer({
  originalImage,
  generatedImageBase64,
  viewMode = "split",
  setViewMode,
  splitPosition = 50,
  setSplitPosition,
  executionTimeMs = 0,
  statusMessage = "",
  styleName = "Scandinavian Japandi",
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownload = () => {
    if (!generatedImageBase64) return;
    const link = document.createElement("a");
    link.href = generatedImageBase64;
    link.download = `SAM3_AI_Restyled_Room_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`relative bg-slate-900/95 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl space-y-4 transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none bg-slate-950 p-6 flex flex-col justify-between overflow-hidden"
          : ""
      }`}
    >
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>{styleName}</span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-extrabold">
                V4.0 LATENT DIFFUSION
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              {generatedImageBase64 ? "Generated with PyTorch CPU Multi-Threading" : "Waiting for generation"}
            </p>
          </div>
        </div>

        {/* Viewport Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === "split"
                ? "bg-pink-600 text-white shadow-md shadow-pink-600/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("generated")}
            disabled={!generatedImageBase64}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === "generated"
                ? "bg-pink-600 text-white shadow-md shadow-pink-600/40"
                : "text-slate-400 hover:text-white disabled:opacity-40"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Restyled</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("original")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === "original"
                ? "bg-pink-600 text-white shadow-md shadow-pink-600/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Original Photo</span>
          </button>
        </div>

        {/* Action Icons: HD Download & Fullscreen */}
        <div className="flex items-center gap-2">
          {generatedImageBase64 && (
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-pink-300 hover:text-white border border-slate-700 transition-all active:scale-95"
              title="Download High-Res Render"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Lightbox"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div
        className={`relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-center ${
          isFullscreen ? "flex-1 my-2" : "h-[450px] md:h-[540px] lg:h-[600px]"
        }`}
      >
        {viewMode === "split" && (
          <ComparisonSlider
            originalImage={originalImage}
            generatedImage={generatedImageBase64}
            splitPosition={splitPosition}
            onSplitChange={setSplitPosition}
            className="w-full h-full"
          />
        )}

        {viewMode === "generated" && generatedImageBase64 && (
          <img
            src={generatedImageBase64}
            alt="AI Restyled Room"
            className="w-full h-full object-cover select-none"
          />
        )}

        {viewMode === "original" && (
          <img
            src={originalImage}
            alt="Original Room"
            className="w-full h-full object-cover select-none"
          />
        )}
      </div>

      {/* Bottom Telemetry & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 pt-1">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-300 font-sans">{statusMessage}</span>
        </div>

        {executionTimeMs > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 text-pink-400 font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>CPU Inpaint: {(executionTimeMs / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>
    </div>
  );
}

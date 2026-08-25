"use client";

import { useRef, useState, useEffect } from "react";
import {
  Upload,
  Plus,
  Minus,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Clock,
} from "lucide-react";
import { CLICK_MODES } from "@/lib/constants";

export function InteractiveCanvas({
  originalImage,
  renderedImage,
  points,
  clickMode,
  isLoading,
  loadingText,
  isUploading,
  uploadProgress,
  activeTab,
  onImageUpload,
  onAddPoint,
}) {
  const imageRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live stopwatch timer during upload & model inference
  useEffect(() => {
    let timer;
    if (isLoading || isUploading) {
      setElapsedSeconds(0);
      const startTime = Date.now();
      timer = setInterval(() => {
        setElapsedSeconds(((Date.now() - startTime) / 1000).toFixed(1));
      }, 100);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isLoading, isUploading]);

  const handleImageClick = (e) => {
    if (!originalImage || isLoading || isUploading) return;
    if (activeTab !== "point") return;

    const imgElement = imageRef.current;
    if (!imgElement) return;

    const rect = imgElement.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const px = clientX - rect.left;
    const py = clientY - rect.top;

    const xNorm = Math.max(0, Math.min(1, px / rect.width));
    const yNorm = Math.max(0, Math.min(1, py / rect.height));

    onAddPoint(xNorm, yNorm);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].type.startsWith("image/")) {
      onImageUpload(files[0]);
    }
  };

  return (
    <div className="w-full">
      {!originalImage ? (
        /* Empty Large Upload Dropzone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`w-full min-h-[600px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-12 text-center transition-all relative ${
            isDragOver
              ? "border-indigo-500 bg-indigo-500/10 scale-[0.99]"
              : "border-slate-800 hover:border-slate-700 bg-slate-900/30 glass-panel"
          }`}
        >
          {/* Subtle Compact Upload Indicator */}
          {isUploading ? (
            <div className="flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <div className="text-center space-y-1">
                <span className="text-sm font-semibold text-white">
                  Embedding Image... {uploadProgress}%
                </span>
                <span className="text-xs text-slate-400 font-mono block">
                  {elapsedSeconds}s
                </span>
              </div>
              {/* Thin subtle 2px progress bar */}
              <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-indigo-500 transition-all duration-200 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1.5 tracking-tight">
                Drop Image Here or Click to Upload
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
                Upload PNG, JPG, or WebP to run instant SAM 3 concept grounding and point segmentation.
              </p>

              <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all active:scale-95">
                <Upload className="w-4 h-4" />
                <span>Select Image File</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) onImageUpload(e.target.files[0]);
                  }}
                />
              </label>
            </>
          )}
        </div>
      ) : (
        /* Dual-Pane View: Input Canvas (Left) & Output (Right) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          {/* 1. INPUT PANE (Interactive Point Clicking) */}
          <div className="rounded-3xl glass-panel p-4 border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                Input Image Canvas
              </span>
              {activeTab === "point" && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  {clickMode === CLICK_MODES.POSITIVE
                    ? "🟢 Add (+)"
                    : "🔴 Subtract (-)"}
                </span>
              )}
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-slate-950/90 border border-slate-800/80 flex items-center justify-center h-[72vh] min-h-[520px] max-h-[85vh] flex-1">
              <img
                ref={imageRef}
                src={originalImage}
                alt="Input Target"
                onClick={handleImageClick}
                className={`w-full h-full max-h-[78vh] object-contain select-none ${
                  activeTab === "point"
                    ? clickMode === CLICK_MODES.POSITIVE
                      ? "cursor-crosshair"
                      : "cursor-not-allowed"
                    : "cursor-default"
                }`}
              />

              {/* Point Pins */}
              {activeTab === "point" &&
                points.map((p, idx) => {
                  const isPos = p.label === CLICK_MODES.POSITIVE;
                  return (
                    <div
                      key={idx}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xl border-2 border-white pointer-events-none transition-transform animate-in zoom-in-50 duration-150 ${
                        isPos
                          ? "bg-emerald-500 text-white ring-4 ring-emerald-500/30"
                          : "bg-rose-500 text-white ring-4 ring-rose-500/30"
                      }`}
                      style={{
                        left: `${p.x * 100}%`,
                        top: `${p.y * 100}%`,
                      }}
                    >
                      {isPos ? (
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <Minus className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                    </div>
                  );
                })}

              {/* Subtle Loading overlay for replacing image */}
              {isUploading && (
                <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 animate-in fade-in duration-150">
                  <Loader2 className="w-7 h-7 text-indigo-400 animate-spin mb-2" />
                  <span className="text-xs font-semibold text-slate-200">
                    Uploading {uploadProgress}% • {elapsedSeconds}s
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 2. OUTPUT PANE (Segmented Result & Overlays) */}
          <div className="rounded-3xl glass-panel p-4 border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-sky-400" />
                SAM 3 Segmentation Output
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                Live Mask Layer
              </span>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-slate-950/90 border border-slate-800/80 flex items-center justify-center h-[72vh] min-h-[520px] max-h-[85vh] flex-1">
              <img
                src={renderedImage}
                alt="Segmentation Result"
                className="w-full h-full max-h-[78vh] object-contain select-none"
              />

              {/* Subtle Minimal Processing Overlay */}
              {isLoading && !isUploading && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 animate-in fade-in duration-150 p-4 text-center">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-2.5" />
                  <p className="text-sm font-semibold text-slate-100 mb-1">
                    {loadingText || "Segmenting with SAM 3..."}
                  </p>
                  <span className="text-xs text-slate-400 font-mono">
                    {elapsedSeconds}s
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

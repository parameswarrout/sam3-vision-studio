"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MoveHorizontal } from "lucide-react";

export function ComparisonSlider({
  originalImage,
  generatedImage,
  splitPosition = 50,
  onSplitChange,
  className = "",
}) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState(splitPosition);

  useEffect(() => {
    setPos(splitPosition);
  }, [splitPosition]);

  const updatePosition = useCallback(
    (clientX) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setPos(percent);
      if (onSplitChange) {
        onSplitChange(percent);
      }
    },
    [onSplitChange]
  );

  const handleMouseDown = () => setIsDragging(true);
  const handleTouchStart = () => setIsDragging(true);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e) => {
      if (isDragging) updatePosition(e.clientX);
    };
    const handleTouchMove = (e) => {
      if (isDragging && e.touches.length > 0) {
        updatePosition(e.touches[0].clientX);
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, updatePosition]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950 shadow-2xl ${className}`}
      style={{ touchAction: "none" }}
    >
      <img
        src={originalImage}
        alt="Original Room"
        className="w-full h-full object-cover select-none pointer-events-none"
      />

      {generatedImage && (
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <img
            src={generatedImage}
            alt="AI Restyled Room"
            className="w-full h-full object-cover select-none"
          />
        </div>
      )}

      {generatedImage && (
        <div
          className="absolute top-0 bottom-0 z-20 cursor-ew-resize flex items-center justify-center pointer-events-auto"
          style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="w-0.5 h-full bg-pink-400 shadow-[0_0_12px_rgba(244,114,182,0.9)]" />

          <div className="absolute w-9 h-9 rounded-full bg-slate-900 border-2 border-pink-400 shadow-xl flex items-center justify-center text-pink-400 active:scale-110 transition-transform">
            <MoveHorizontal className="w-4 h-4" />
          </div>
        </div>
      )}

      <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-bold text-pink-400 border border-pink-500/30 flex items-center gap-1.5 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
        <span>V4.0 AI RESTYLED ROOM</span>
      </div>

      <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-bold text-slate-300 border border-slate-700/60 shadow-lg">
        ORIGINAL PHOTO
      </div>
    </div>
  );
}

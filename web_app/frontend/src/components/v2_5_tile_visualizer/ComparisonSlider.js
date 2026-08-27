"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { GripVertical } from "lucide-react";

export function ComparisonSlider({
  originalImage,
  renderedImage,
  splitPosition = 50,
  onSplitChange,
}) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      onSplitChange(percent);
    },
    [isDragging, onSplitChange]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("mouseup", handlePointerUp);
      window.addEventListener("touchmove", handlePointerMove);
      window.addEventListener("touchend", handlePointerUp);
    }
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden select-none cursor-ew-resize border border-slate-700/80 bg-slate-950"
      onMouseDown={() => setIsDragging(true)}
      onTouchStart={() => setIsDragging(true)}
    >
      {/* 1. Underlying Base: Original Room Image (Before) */}
      <img
        src={originalImage}
        alt="Original Before"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />

      {/* 2. Top Clapped Layer: Rendered Tiled Room (After) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ clipPath: `polygon(${splitPosition}% 0, 100% 0, 100% 100%, ${splitPosition}% 100%)` }}
      >
        <img
          src={renderedImage}
          alt="Rendered After"
          className="absolute inset-0 w-full h-full object-contain"
        />
      </div>

      {/* 3. Divider Line & Handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] pointer-events-none z-20"
        style={{ left: `${splitPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-2xl ring-4 ring-indigo-500/50">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      {/* 4. Overlay Watermark Pills */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none">
        <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[10px] font-black font-mono uppercase tracking-wider text-slate-300 border border-white/10 shadow-lg">
          Original Before
        </span>
      </div>
      <div className="absolute top-3 right-3 z-20 pointer-events-none">
        <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 backdrop-blur-md text-[10px] font-black font-mono uppercase tracking-wider text-emerald-300 border border-emerald-500/30 shadow-lg">
          ✨ SAM 3 Tiled After
        </span>
      </div>
    </div>
  );
}

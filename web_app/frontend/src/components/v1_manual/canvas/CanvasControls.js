"use client";

import { useState } from "react";
import { Download, RefreshCw, Eye, EyeOff, Image as ImageIcon } from "lucide-react";

export function CanvasControls({
  hasImage,
  imageMeta,
  originalImage,
  renderedImage,
  onReset,
}) {
  const [showOriginal, setShowOriginal] = useState(false);

  const handleDownload = () => {
    const target = showOriginal ? originalImage : renderedImage;
    if (!target) return;
    const a = document.createElement("a");
    a.href = target;
    a.download = `sam3-segmentation-${Date.now()}.png`;
    a.click();
  };

  if (!hasImage) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-2 text-xs">
      {/* Left: Metadata */}
      <div className="flex items-center gap-2 text-slate-400">
        <ImageIcon className="w-4 h-4 text-slate-500" />
        <span>
          Resolution: <strong className="text-slate-200">{imageMeta.width} × {imageMeta.height} px</strong>
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-all font-medium"
          title="Download segmented output"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>

        {/* Reset / New Image */}
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all font-medium"
          title="Reset canvas"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Image</span>
        </button>
      </div>
    </div>
  );
}

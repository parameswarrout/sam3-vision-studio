"use client";

import { useRef } from "react";
import { Upload, CheckCircle2, Sparkles, Loader2 } from "lucide-react";

export function SampleRoomGallery({
  sampleRooms,
  selectedRoom,
  onSelectSample,
  onUploadCustom,
  isUploading,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadCustom(file);
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 p-4 shadow-xl backdrop-blur-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-mono text-xs font-black">
            1
          </div>
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            Select Room Photo
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isUploading && (
            <span className="flex items-center gap-1 text-[10px] text-amber-300 font-mono font-bold bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
              <span>Syncing SAM 3...</span>
            </span>
          )}
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            6 Presets + Custom Upload
          </span>
        </div>
      </div>

      {/* Horizontal Carousel / Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {sampleRooms.map((room) => {
          const isSelected = selectedRoom?.id === room.id;
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => onSelectSample(room)}
              className={`group relative rounded-xl overflow-hidden border text-left transition-all duration-200 aspect-[4/3] flex flex-col justify-end p-2 cursor-pointer ${
                isSelected
                  ? "border-sky-400 ring-2 ring-sky-500/60 shadow-lg shadow-sky-500/25 scale-[1.02] bg-slate-900"
                  : "border-slate-800 hover:border-slate-600 hover:scale-[1.01] opacity-80 hover:opacity-100 bg-slate-950"
              }`}
            >
              {/* Background Thumbnail */}
              <img
                src={room.image}
                alt={room.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />

              {/* Selection Checkmark */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              )}

              {/* Room Badge & Label */}
              <div className="relative z-10 pointer-events-none">
                <span className="text-[9px] font-bold font-mono uppercase px-1.5 py-0.2 rounded bg-slate-900/90 text-sky-300 border border-sky-500/30">
                  {room.type}
                </span>
                <p className="text-[10px] font-bold text-white truncate mt-0.5 leading-tight">
                  {room.title}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Upload Custom Room Box */}
      <div className="pt-1 flex items-center justify-between gap-3 border-t border-slate-800/80">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 text-xs font-semibold hover:border-indigo-500/50 hover:text-white transition-all shadow-sm active:scale-98 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-indigo-400" />
          <span>Upload Custom Home Photo (JPG, PNG, WebP)</span>
        </button>

        {selectedRoom && (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Target: <strong className="text-white capitalize">{selectedRoom.recommended_surface}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}

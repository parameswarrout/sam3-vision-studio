"use client";

import { UploadCloud, Image as ImageIcon, Check } from "lucide-react";

export function SampleRoomGallery({
  sampleRooms,
  selectedRoom,
  onSelectRoom,
  onUploadCustom,
  isUploading,
}) {
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
        <span className="text-[11px] text-slate-400 font-medium">
          6 Architectural Presets
        </span>
      </div>

      {/* Grid of 6 Sample Rooms */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {sampleRooms.map((room) => {
          const isSelected = selectedRoom?.id === room.id;
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => onSelectRoom(room)}
              className={`group relative rounded-xl overflow-hidden border text-left transition-all duration-200 aspect-[4/3] flex flex-col justify-end p-2 ${
                isSelected
                  ? "border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-500/20 scale-[1.02]"
                  : "border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100"
              }`}
            >
              <img
                src={room.image}
                alt={room.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

              <div className="relative z-10">
                <span className="text-[9px] font-mono font-semibold text-emerald-400 uppercase tracking-wider block">
                  {room.category}
                </span>
                <span className="text-[11px] font-bold text-white line-clamp-1">
                  {room.title}
                </span>
              </div>

              {isSelected && (
                <div className="absolute top-1.5 right-1.5 z-10 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Drag and Drop Custom Room Upload */}
      <label className="relative flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 hover:bg-slate-950/80 hover:border-indigo-500/60 cursor-pointer transition-all text-xs font-medium text-slate-300 hover:text-white">
        <UploadCloud className="w-4 h-4 text-indigo-400" />
        <span>{isUploading ? "Uploading & Computing Neural Features..." : "Or Upload Your Own Room Photo (JPG/PNG)"}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>
    </div>
  );
}

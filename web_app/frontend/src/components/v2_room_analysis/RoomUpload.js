"use client";

import { useState } from "react";
import { Upload, Sparkles, Home, BedDouble, UtensilsCrossed, ArrowRight } from "lucide-react";

const SAMPLE_ROOMS = [
  {
    id: "living_room",
    title: "Modern Living Room",
    subtitle: "Sofa, large window, wood floor & wall",
    image: "/samples/living_room.jpg",
    icon: Home,
    badge: "Living Room",
    color: "from-blue-600 to-indigo-600",
  },
  {
    id: "bedroom",
    title: "Cozy Bedroom",
    subtitle: "Accent wall, bed, window & carpet",
    image: "/samples/bedroom.jpg",
    icon: BedDouble,
    badge: "Bedroom",
    color: "from-purple-600 to-indigo-600",
  },
  {
    id: "kitchen",
    title: "Open Kitchen & Dining",
    subtitle: "Marble island, ceiling, floor & cabinets",
    image: "/samples/kitchen.jpg",
    icon: UtensilsCrossed,
    badge: "Kitchen",
    color: "from-emerald-600 to-teal-600",
  },
];

export function RoomUpload({ onUpload, isAnalyzing }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [loadingSample, setLoadingSample] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].type.startsWith("image/")) {
      onUpload(files[0]);
    }
  };

  const handleSampleClick = async (sample) => {
    try {
      setLoadingSample(sample.id);
      const res = await fetch(sample.image);
      const blob = await res.blob();
      const filename = `${sample.id}.jpg`;
      const file = new File([blob], filename, { type: "image/jpeg" });
      onUpload(file);
    } catch (err) {
      console.error("Failed to load sample:", err);
    } finally {
      setLoadingSample(null);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-6 max-w-4xl mx-auto py-2">
      {/* 1. Main Dropzone Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`w-full border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 text-center transition-all ${
          isDragOver
            ? "border-indigo-500 bg-indigo-500/10 scale-[0.99]"
            : "border-slate-700 hover:border-slate-600 bg-slate-900/80 glass-panel shadow-2xl"
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600/30 to-sky-500/20 border border-indigo-500/40 flex items-center justify-center mb-4 text-indigo-300 shadow-inner">
          <Sparkles className="w-7 h-7" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          Autonomous Room & Surface Analysis
        </h2>
        <p className="text-sm text-slate-300 max-w-lg mb-6 leading-relaxed">
          Upload any interior room photo. SAM 3 will automatically extract Wall planes, Floor, Ceiling, Windows, Doors, and Furniture.
        </p>

        <label
          className={`cursor-pointer inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 shadow-xl shadow-indigo-600/30 transition-all active:scale-95 ${
            isAnalyzing ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Custom Room Photo</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isAnalyzing}
            onChange={(e) => {
              if (e.target.files?.[0]) onUpload(e.target.files[0]);
            }}
          />
        </label>
      </div>

      {/* 2. Visual Home Sample Cards Section */}
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Home className="w-4 h-4 text-indigo-400" />
            Or try with sample interior rooms:
          </span>
          <span className="text-xs text-slate-400">Click any image to analyze instantly</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SAMPLE_ROOMS.map((sample) => {
            const Icon = sample.icon;
            const isLoadingThis = loadingSample === sample.id;

            return (
              <div
                key={sample.id}
                onClick={() => !isAnalyzing && handleSampleClick(sample)}
                className={`group relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 hover:border-indigo-400/80 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 ${
                  isAnalyzing ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {/* Thumbnail Image */}
                <div className="relative h-36 w-full overflow-hidden bg-slate-950">
                  <img
                    src={sample.image}
                    alt={sample.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                  {/* Badge */}
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-white bg-slate-900/80 backdrop-blur-md border border-white/15 shadow-sm">
                    {sample.badge}
                  </span>
                </div>

                {/* Card Details */}
                <div className="p-3.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {sample.title}
                    </h4>
                    <p className="text-[11px] text-slate-300 truncate mt-0.5 font-medium">
                      {sample.subtitle}
                    </p>
                  </div>

                  <div className="w-7 h-7 rounded-xl bg-slate-800 group-hover:bg-indigo-600 flex items-center justify-center text-slate-300 group-hover:text-white transition-all shrink-0">
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

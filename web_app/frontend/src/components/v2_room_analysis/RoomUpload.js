"use client";

import { useState } from "react";
import {
  Upload,
  Sparkles,
  Home,
  BedDouble,
  UtensilsCrossed,
  Bath,
  Briefcase,
  Wine,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Compass,
  CheckCircle2,
} from "lucide-react";

const SAMPLE_ROOMS = [
  {
    id: "living_room",
    title: "Modern Living Room",
    subtitle: "Sofa, picture window, hardwood floor & wall planes",
    image: "/samples/living_room.jpg",
    icon: Home,
    badge: "Living Room",
    tag: "Multi-Wall Surface",
  },
  {
    id: "bedroom",
    title: "Master Bedroom",
    subtitle: "Wood slat accent wall, bed frame & picture window",
    image: "/samples/bedroom.jpg",
    icon: BedDouble,
    badge: "Bedroom",
    tag: "Accent Wall Plane",
  },
  {
    id: "kitchen",
    title: "Open Kitchen & Island",
    subtitle: "Marble island countertop, ceiling & kitchen cabinets",
    image: "/samples/kitchen.jpg",
    icon: UtensilsCrossed,
    badge: "Kitchen",
    tag: "Island & Tile Seam",
  },
  {
    id: "bathroom",
    title: "Luxury Bathroom",
    subtitle: "Large ceramic wall tiles, marble floor & vanity",
    image: "/samples/bathroom.jpg",
    icon: Bath,
    badge: "Bathroom",
    tag: "Wall & Floor Tiles",
  },
  {
    id: "office",
    title: "Executive Home Office",
    subtitle: "Slatted wooden wall, desk, office chair & floor",
    image: "/samples/office.jpg",
    icon: Briefcase,
    badge: "Office",
    tag: "Slatted Wall Texture",
  },
  {
    id: "dining_room",
    title: "Modern Dining Area",
    subtitle: "Dining table set, artwork wall & panoramic window",
    image: "/samples/dining_room.jpg",
    icon: Wine,
    badge: "Dining Room",
    tag: "Large Ground Plane",
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
    <div className="w-full max-w-[1600px] mx-auto h-full flex flex-col justify-between py-1 gap-4 overflow-y-auto">
      {/* 1. Main Hero Dropzone Banner */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`w-full relative overflow-hidden rounded-3xl border-2 border-dashed flex items-center justify-between p-5 sm:p-7 transition-all shrink-0 ${
          isDragOver
            ? "border-sky-400 bg-sky-500/10 scale-[0.99]"
            : "border-slate-700/80 hover:border-slate-600 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-950/95 shadow-2xl backdrop-blur-2xl"
        }`}
      >
        {/* Glow ambient background elements */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-sky-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-start text-left max-w-2xl min-w-0 pr-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold mb-2 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Meta SAM 3 Autonomous Vision Engine</span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight mb-1.5">
            Autonomous Room & Surface Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            Upload any interior room photo or click a benchmark below. SAM 3 automatically identifies distinct Wall planes, Floor, Ceiling, Windows, Doors, and Furniture with sub-pixel precision.
          </p>
        </div>

        {/* Upload Button & Drop Info */}
        <div className="flex flex-col items-end shrink-0">
          <label
            className={`cursor-pointer inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 shadow-xl shadow-indigo-600/30 transition-all active:scale-95 border border-white/20 ${
              isAnalyzing ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <Upload className="w-5 h-5" />
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
          <span className="text-[11px] text-slate-400 mt-2 font-medium">
            Supports JPEG, PNG, WebP • Drag & drop anywhere
          </span>
        </div>
      </div>

      {/* 2. Visual Home Sample Gallery (Large 2-Row x 3-Column Cards) */}
      <div className="w-full space-y-2.5 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between px-1 shrink-0">
          <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Home className="w-4 h-4 text-indigo-400" />
            Select an interior room benchmark to analyze instantly:
          </span>
          <span className="text-xs text-slate-400 font-medium">Click any card to start analysis</span>
        </div>

        {/* 3 Columns x 2 Rows with LARGE images */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 flex-1 min-h-0">
          {SAMPLE_ROOMS.map((sample) => {
            const isLoadingThis = loadingSample === sample.id;

            return (
              <div
                key={sample.id}
                onClick={() => !isAnalyzing && handleSampleClick(sample)}
                className={`group relative rounded-3xl overflow-hidden border border-slate-700/80 bg-slate-900 hover:border-sky-400 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-sky-500/20 hover:-translate-y-1 flex flex-col justify-between ${
                  isAnalyzing ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {/* Extra-Large High-Res Thumbnail Image */}
                <div className="relative h-44 sm:h-48 lg:h-52 w-full overflow-hidden bg-slate-950 flex-1 min-h-0">
                  <img
                    src={sample.image}
                    alt={sample.title}
                    className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                  />
                  {/* Subtle Top & Bottom Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/15 to-slate-950/40 opacity-75 group-hover:opacity-60 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black text-white bg-slate-900/90 backdrop-blur-md border border-white/20 shadow-md">
                      {sample.badge}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold text-sky-200 bg-indigo-950/90 border border-indigo-500/40 shadow-sm">
                      {sample.tag}
                    </span>
                  </div>
                </div>

                {/* Card Info Footer */}
                <div className="p-3.5 flex items-center justify-between gap-2 bg-slate-900 border-t border-slate-800 shrink-0">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black text-white group-hover:text-sky-300 transition-colors truncate">
                      {sample.title}
                    </h4>
                    <p className="text-xs text-slate-400 truncate mt-0.5 font-medium">
                      {sample.subtitle}
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-slate-800 group-hover:bg-sky-500 flex items-center justify-center text-slate-300 group-hover:text-white transition-all shrink-0 shadow-md">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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

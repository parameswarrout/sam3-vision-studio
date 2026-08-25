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
    tag: "Multi-Wall",
  },
  {
    id: "bedroom",
    title: "Master Bedroom",
    subtitle: "Wood slat accent wall, bed frame & picture window",
    image: "/samples/bedroom.jpg",
    icon: BedDouble,
    badge: "Bedroom",
    tag: "Accent Wall",
  },
  {
    id: "kitchen",
    title: "Open Kitchen & Island",
    subtitle: "Marble island countertop, ceiling & kitchen cabinets",
    image: "/samples/kitchen.jpg",
    icon: UtensilsCrossed,
    badge: "Kitchen",
    tag: "Island & Tile",
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
    tag: "Slat Texture",
  },
  {
    id: "dining_room",
    title: "Modern Dining Area",
    subtitle: "Dining table set, artwork wall & panoramic window",
    image: "/samples/dining_room.jpg",
    icon: Wine,
    badge: "Dining Room",
    tag: "Large Floor",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Sub-Second ViT Inference",
    desc: "Single-pass ViT feature caching with instant text queries",
  },
  {
    icon: Compass,
    title: "3D Planar Geometry",
    desc: "Surface normal vectors & physical vertical seam detection",
  },
  {
    icon: Layers,
    title: "Confidence-Aware Occlusion",
    desc: "Preserves structural surfaces while carving openings & obstacles",
  },
  {
    icon: ShieldCheck,
    title: "V3 Tile Visualization Ready",
    desc: "Watertight planar masks verified with 90.2% Mean IoU",
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
    <div className="w-full max-w-7xl mx-auto h-full flex flex-col justify-between py-2 sm:py-3 gap-3 sm:gap-4 overflow-y-auto">
      {/* 1. Main Hero Dropzone Banner */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`w-full relative overflow-hidden rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 sm:p-8 text-center transition-all shrink-0 ${
          isDragOver
            ? "border-sky-400 bg-sky-500/10 scale-[0.99]"
            : "border-slate-700/80 hover:border-slate-600 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 shadow-2xl backdrop-blur-2xl"
        }`}
      >
        {/* Glow ambient background elements */}
        <div className="absolute -top-28 -left-28 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -right-28 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold mb-3 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Meta SAM 3 Autonomous Vision Engine</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mb-2">
          Autonomous Room & Surface Analysis
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mb-5 leading-relaxed">
          Upload any interior room photo. SAM 3 automatically identifies distinct Wall planes, Floor, Ceiling, Windows, Doors, and Furniture with sub-pixel precision.
        </p>

        {/* Upload Button */}
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
          Supports JPEG, PNG, WebP • Drag & drop image anywhere above
        </span>
      </div>

      {/* 2. Visual Home Sample Gallery (6 Rich Cards) */}
      <div className="w-full space-y-2.5 shrink-0">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Home className="w-4 h-4 text-indigo-400" />
            Or click any sample room below to test instantly:
          </span>
          <span className="text-xs text-slate-400 font-medium">6 realistic interior benchmarks</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {SAMPLE_ROOMS.map((sample) => {
            const isLoadingThis = loadingSample === sample.id;

            return (
              <div
                key={sample.id}
                onClick={() => !isAnalyzing && handleSampleClick(sample)}
                className={`group relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900 hover:border-indigo-400 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 flex flex-col justify-between ${
                  isAnalyzing ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {/* Large Thumbnail Image */}
                <div className="relative h-32 sm:h-36 lg:h-40 w-full overflow-hidden bg-slate-950">
                  <img
                    src={sample.image}
                    alt={sample.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                  {/* Subtle Dark Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black text-white bg-slate-900/90 backdrop-blur-md border border-white/20 shadow-sm">
                      {sample.badge}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-sky-200 bg-indigo-950/90 border border-indigo-500/40">
                      {sample.tag}
                    </span>
                  </div>
                </div>

                {/* Card Info Footer */}
                <div className="p-3 flex items-center justify-between gap-1.5 bg-slate-900 border-t border-slate-800">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black text-white group-hover:text-indigo-300 transition-colors truncate">
                      {sample.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                      {sample.subtitle}
                    </p>
                  </div>

                  <div className="w-6 h-6 rounded-xl bg-slate-800 group-hover:bg-indigo-600 flex items-center justify-center text-slate-300 group-hover:text-white transition-all shrink-0 shadow-sm">
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Capability Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {FEATURES.map((feat, idx) => {
          const FeatIcon = feat.icon;
          return (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3 shadow-md"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <FeatIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-extrabold text-white truncate">{feat.title}</h4>
                <p className="text-[10px] text-slate-400 truncate font-medium">{feat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

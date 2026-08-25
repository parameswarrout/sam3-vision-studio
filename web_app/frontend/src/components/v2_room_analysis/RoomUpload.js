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
} from "lucide-react";

const SAMPLE_ROOMS = [
  {
    id: "living_room",
    title: "Modern Living Room",
    subtitle: "Sofa, picture window, wood floor & walls",
    image: "/samples/living_room.jpg",
    icon: Home,
    badge: "Living Room",
    color: "from-blue-600 to-indigo-600",
  },
  {
    id: "bedroom",
    title: "Master Bedroom",
    subtitle: "Wood slat accent wall, bed & window",
    image: "/samples/bedroom.jpg",
    icon: BedDouble,
    badge: "Bedroom",
    color: "from-purple-600 to-indigo-600",
  },
  {
    id: "kitchen",
    title: "Open Kitchen & Island",
    subtitle: "Marble countertop, ceiling & cabinets",
    image: "/samples/kitchen.jpg",
    icon: UtensilsCrossed,
    badge: "Kitchen",
    color: "from-emerald-600 to-teal-600",
  },
  {
    id: "bathroom",
    title: "Luxury Bathroom",
    subtitle: "Large wall tiles, marble floor & vanity",
    image: "/samples/bathroom.jpg",
    icon: Bath,
    badge: "Bathroom",
    color: "from-cyan-600 to-blue-600",
  },
  {
    id: "office",
    title: "Executive Home Office",
    subtitle: "Slatted wall, desk, chair & window",
    image: "/samples/office.jpg",
    icon: Briefcase,
    badge: "Office",
    color: "from-amber-600 to-orange-600",
  },
  {
    id: "dining_room",
    title: "Modern Dining Area",
    subtitle: "Dining table, art wall & wide window",
    image: "/samples/dining_room.jpg",
    icon: Wine,
    badge: "Dining Room",
    color: "from-rose-600 to-pink-600",
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
    <div className="w-full flex flex-col items-center justify-center space-y-4 max-w-5xl mx-auto py-1">
      {/* 1. Main Dropzone Area (Nano Banner Styling) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`w-full relative overflow-hidden rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all ${
          isDragOver
            ? "border-indigo-400 bg-indigo-500/10 scale-[0.99]"
            : "border-slate-700/80 hover:border-slate-600 bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-2xl backdrop-blur-2xl"
        }`}
      >
        {/* Glow ambient circle in background */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-sky-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-400 p-[1px] mb-3 shadow-lg shadow-indigo-500/25">
          <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center text-sky-400">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1.5">
          Autonomous Room & Surface Analysis
        </h2>
        <p className="text-xs text-slate-300 max-w-lg mb-4 leading-relaxed">
          Upload any interior room photo. SAM 3 automatically parses 3D Wall planes, Floor, Ceiling, Windows, Doors, and Furniture.
        </p>

        <label
          className={`cursor-pointer inline-flex items-center gap-2.5 px-7 py-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 shadow-xl shadow-indigo-600/30 transition-all active:scale-95 ${
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

      {/* 2. Visual Home Sample Gallery (6 Diverse Rooms) */}
      <div className="w-full space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Home className="w-4 h-4 text-indigo-400" />
            Or test with sample interior rooms:
          </span>
          <span className="text-xs text-slate-400 font-medium">Click any room photo to analyze</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {SAMPLE_ROOMS.map((sample) => {
            const Icon = sample.icon;
            const isLoadingThis = loadingSample === sample.id;

            return (
              <div
                key={sample.id}
                onClick={() => !isAnalyzing && handleSampleClick(sample)}
                className={`group relative rounded-2xl overflow-hidden border border-slate-700/90 bg-slate-900 hover:border-indigo-400/90 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-indigo-500/15 hover:-translate-y-1 ${
                  isAnalyzing ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {/* Thumbnail Image */}
                <div className="relative h-24 w-full overflow-hidden bg-slate-950">
                  <img
                    src={sample.image}
                    alt={sample.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-90" />

                  {/* Badge */}
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.2 rounded-md text-[9px] font-black text-white bg-slate-900/90 backdrop-blur-md border border-white/20 shadow-sm">
                    {sample.badge}
                  </span>
                </div>

                {/* Card Details */}
                <div className="p-2.5 flex items-center justify-between gap-1.5 bg-slate-900">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[11px] font-extrabold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {sample.title}
                    </h4>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5 font-medium">
                      {sample.subtitle}
                    </p>
                  </div>

                  <div className="w-5 h-5 rounded-lg bg-slate-800 group-hover:bg-indigo-600 flex items-center justify-center text-slate-300 group-hover:text-white transition-all shrink-0">
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
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

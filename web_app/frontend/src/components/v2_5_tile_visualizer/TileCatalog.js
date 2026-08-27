"use client";

import { useState, useMemo } from "react";
import { Check, Sparkles, Layers, Info } from "lucide-react";

export function TileCatalog({
  tileCatalog,
  selectedTileId,
  onSelectTile,
  selectedCategory,
  onSelectCategory,
}) {
  const categories = [
    { id: "all", label: "All Varieties (16)", icon: "✨" },
    { id: "marble", label: "Italian Marble", icon: "🏛️" },
    { id: "wood", label: "Wood Planks & Parquet", icon: "🌲" },
    { id: "ceramic", label: "Ceramic & Subway", icon: "🧱" },
    { id: "stone", label: "Slate & Terrazzo", icon: "🪨" },
    { id: "mosaic", label: "Moroccan & Zellige", icon: "🎨" },
  ];

  const filteredTiles = useMemo(() => {
    if (selectedCategory === "all") return tileCatalog;
    return tileCatalog.filter((t) => t.category === selectedCategory);
  }, [tileCatalog, selectedCategory]);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 p-4 shadow-xl backdrop-blur-xl space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-mono text-xs font-black">
            3
          </div>
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            Architectural Tile Catalog (16 Varieties)
          </h2>
        </div>
        <span className="text-[11px] text-purple-300 font-mono font-semibold bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-full">
          Photorealistic High-Res
        </span>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                isSelected
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400"
                  : "bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Responsive Grid of Tile Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
        {filteredTiles.map((tile) => {
          const isSelected = selectedTileId === tile.id;
          return (
            <button
              key={tile.id}
              type="button"
              onClick={() => onSelectTile(tile.id)}
              className={`group relative rounded-xl overflow-hidden border text-left p-2.5 transition-all duration-200 flex flex-col justify-between gap-2 ${
                isSelected
                  ? "border-purple-400 bg-purple-950/40 ring-2 ring-purple-500/60 shadow-lg shadow-purple-500/20 scale-[1.02]"
                  : "border-slate-800 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-900"
              }`}
            >
              {/* Texture Square Thumbnail */}
              <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-white/10 shadow-inner group-hover:scale-[1.03] transition-transform duration-200">
                <img
                  src={tile.thumbnail_url || `/tiles/${tile.id}.png`}
                  alt={tile.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const src = target.src;
                    if (src.includes("mytyles_")) {
                      target.src = src.replace("mytyles_", "");
                    } else {
                      target.src = `http://localhost:8000/api/v1/v2.5/tiles/texture/${tile.id}`;
                    }
                  }}
                />
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg ring-2 ring-white/50">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
                {tile.tag && (
                  <span className="absolute bottom-1 left-1 text-[8px] font-bold font-mono uppercase px-1 py-0.2 rounded bg-slate-950/90 text-amber-300 border border-amber-500/30">
                    {tile.tag}
                  </span>
                )}
              </div>

              {/* Specs */}
              <div>
                <p className={`text-xs font-bold truncate leading-tight ${isSelected ? "text-white" : "text-slate-200"}`}>
                  {tile.name}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[9px] font-mono text-slate-400 truncate">
                    {tile.material}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-indigo-300/80 truncate block">
                  {tile.finish}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Check, Sparkles, Box, Info } from "lucide-react";

export function TileCatalog({
  catalog,
  selectedTileId,
  onSelectTile,
  selectedCategory,
  onSelectCategory,
}) {
  const categories = [
    { id: "all", name: "All Tiles", count: catalog?.length || 16 },
    { id: "marble", name: "Marble & Onyx", count: 3 },
    { id: "wood", name: "Wood & Parquet", count: 3 },
    { id: "ceramic", name: "Ceramic & Subway", count: 3 },
    { id: "stone", name: "Natural Stone & Slate", count: 4 },
    { id: "mosaic", name: "Mosaic & Encaustic", count: 3 },
  ];

  const filteredTiles = (catalog || []).filter((tile) => {
    if (selectedCategory === "all") return true;
    return tile.category === selectedCategory;
  });

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 p-4 shadow-xl backdrop-blur-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-mono text-xs font-black">
            3
          </div>
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            Architectural Tile Catalog ({catalog?.length || 16} Varieties)
          </h2>
        </div>
        <span className="text-[11px] text-amber-300 font-mono font-semibold bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
          Real MyTyles.com Textures
        </span>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              selectedCategory === cat.id
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <span>{cat.name}</span>
            <span className="text-[10px] opacity-75 font-mono">({cat.count})</span>
          </button>
        ))}
      </div>

      {/* Tile Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
        {filteredTiles.map((tile) => {
          const isSelected = selectedTileId === tile.id;
          return (
            <button
              key={tile.id}
              type="button"
              onClick={() => onSelectTile(tile.id)}
              className={`group relative rounded-xl overflow-hidden border text-left transition-all duration-200 flex flex-col justify-between p-2 bg-slate-950/80 hover:bg-slate-950 ${
                isSelected
                  ? "border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 scale-[1.02]"
                  : "border-slate-800 hover:border-slate-600 opacity-85 hover:opacity-100"
              }`}
            >
              {/* Tile Thumbnail with multi-tier fallback */}
              <div className="w-full aspect-square rounded-lg overflow-hidden border border-slate-800/80 mb-2 relative bg-slate-900">
                <img
                  src={tile.thumbnail_url || `/tiles/${tile.id}.png`}
                  alt={tile.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 pointer-events-none"
                  onError={(e) => {
                    if (!e.target.dataset.triedAliases) {
                      e.target.dataset.triedAliases = "true";
                      const legacyMap = {
                        "carrara_white_marble": "mytyles_carrara_marble",
                        "calacatta_gold_marble": "mytyles_calacatta_gold",
                        "nero_marquina_black": "mytyles_nero_marquina",
                        "rustic_oak_wood_plank": "mytyles_rustic_oak_wood",
                        "dark_walnut_herringbone": "mytyles_walnut_herringbone",
                        "scandinavian_light_ash": "mytyles_nordic_ash_wood",
                        "emerald_subway_ceramic": "mytyles_emerald_subway",
                        "white_gloss_subway": "mytyles_arctic_white_subway",
                        "terracotta_cottage_hex": "mytyles_terracotta_hexagon",
                        "moroccan_geometric_mosaic": "mytyles_moroccan_zellige",
                        "venetian_terrazzo_multi": "mytyles_venetian_terrazzo",
                        "anthracite_slate_stone": "mytyles_charcoal_slate",
                        "travertine_beige_stone": "mytyles_roman_travertine",
                        "art_deco_navy_gold_fan": "mytyles_art_deco_mosaic",
                        "grey_concrete_industrial": "mytyles_concrete_industrial",
                        "spanish_andalusian_floral": "mytyles_andalusian_majolica",
                      };
                      if (legacyMap[tile.id]) {
                        e.target.src = `/tiles/${legacyMap[tile.id]}.png`;
                        return;
                      }
                    }
                    e.target.src = `http://127.0.0.1:8000/api/v1/v3/tiles/texture/${tile.id}`;
                  }}
                />
                {tile.tag && (
                  <span className="absolute top-1 left-1 text-[8px] font-bold font-mono px-1 py-0.2 rounded bg-black/80 text-amber-300 border border-amber-500/30">
                    {tile.tag}
                  </span>
                )}
                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Title & Material Specs */}
              <div>
                <span className="text-[9px] font-mono font-semibold text-amber-400 uppercase tracking-wider block">
                  {tile.category}
                </span>
                <span className="text-[10px] font-bold text-white line-clamp-1 leading-tight">
                  {tile.name}
                </span>
                <span className="text-[9px] text-slate-400 line-clamp-1 leading-none mt-0.5">
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

"use client";

import { useState } from "react";
import {
  Layers,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Grid,
  Sun,
  Armchair,
  SlidersHorizontal,
  Focus,
  X,
} from "lucide-react";
import { RegionItem } from "./RegionItem";

export function RegionList({
  regions = [],
  visibleRegions,
  hoveredRegionId,
  onToggleRegion,
  onToggleCategory,
  onShowOnlyCategory,
  onHoverRegion,
  onShowAll,
  onHideAll,
  onReset,
  executionTimeMs,
  metadata,
}) {
  const [activeFilter, setActiveFilter] = useState("all");

  const wallRegions = regions.filter((r) => r.type === "wall");
  const floorRegions = regions.filter((r) => r.type === "floor");
  const windowRegions = regions.filter((r) => r.type === "window");
  const doorRegions = regions.filter((r) => r.type === "door");
  const openingRegions = [...windowRegions, ...doorRegions];
  const furnitureRegions = regions.filter((r) => r.type === "furniture");

  const wallCount = wallRegions.length;
  const floorCount = floorRegions.length;
  const openingCount = openingRegions.length;
  const furnitureCount = furnitureRegions.length;
  const visibleCount = visibleRegions.size;
  const needsReviewCount = regions.filter((r) => r.needs_review).length;

  const isCategoryVisible = (catRegions) => {
    if (catRegions.length === 0) return false;
    return catRegions.some((r) => visibleRegions.has(r.id));
  };

  const isCategoryFullyVisible = (catRegions) => {
    if (catRegions.length === 0) return false;
    return catRegions.every((r) => visibleRegions.has(r.id));
  };

  const filterTabs = [
    { id: "all", label: "All Surfaces", count: regions.length, icon: Layers },
    { id: "wall", label: "Walls", count: wallCount, icon: Building2 },
    { id: "floor", label: "Floor", count: floorCount, icon: Grid },
    { id: "openings", label: "Openings", count: openingCount, icon: Sun },
    { id: "furniture", label: "Furniture", count: furnitureCount, icon: Armchair },
  ];

  const filteredRegions = regions.filter((r) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "wall") return r.type === "wall";
    if (activeFilter === "floor") return r.type === "floor";
    if (activeFilter === "openings") return r.type === "window" || r.type === "door";
    if (activeFilter === "furniture") return r.type === "furniture";
    if (activeFilter === "ceiling") return r.type === "ceiling";
    return true;
  });

  const isAllVisible = regions.length > 0 && visibleCount === regions.length;
  const isNoneVisible = visibleCount === 0;

  const handleCardFilterClick = (catId) => {
    // If already active, toggle back to 'all' so cards are never permanently stuck
    setActiveFilter((prev) => (prev === catId ? "all" : catId));
  };

  const categories = [
    {
      id: "wall",
      label: "Walls",
      count: wallCount,
      regions: wallRegions,
      activeBg: "bg-blue-950/90 border-blue-400 ring-1 ring-blue-400",
      textColor: "text-blue-300",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    {
      id: "floor",
      label: "Floor",
      count: floorCount,
      regions: floorRegions,
      activeBg: "bg-emerald-950/90 border-emerald-400 ring-1 ring-emerald-400",
      textColor: "text-emerald-300",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
    {
      id: "openings",
      label: "Openings",
      count: openingCount,
      regions: openingRegions,
      activeBg: "bg-sky-950/90 border-sky-400 ring-1 ring-sky-400",
      textColor: "text-sky-300",
      badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    },
    {
      id: "furniture",
      label: "Furniture",
      count: furnitureCount,
      regions: furnitureRegions,
      activeBg: "bg-pink-950/90 border-pink-400 ring-1 ring-pink-400",
      textColor: "text-pink-300",
      badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    },
  ];

  return (
    <div className="w-full h-full min-h-0 rounded-3xl bg-slate-900/95 backdrop-blur-2xl p-4 border border-slate-700 shadow-2xl shadow-black/50 flex flex-col gap-3">
      {/* 1. Header with Glow Badge & Reset Button */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-700/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-md shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                Detected Surfaces
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/25 text-indigo-200 font-mono font-extrabold border border-indigo-500/40">
                {visibleCount}/{regions.length} visible
              </span>
            </div>
            {needsReviewCount > 0 ? (
              <p className="text-[11px] text-amber-300 font-semibold flex items-center gap-1 mt-0.5">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                {needsReviewCount} surface{needsReviewCount > 1 ? "s" : ""} flagged for review
              </p>
            ) : (
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                All surface boundaries verified
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-600 shadow-md transition-all active:scale-95 shrink-0"
          title="Upload a new room photo"
        >
          <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
          <span>New</span>
        </button>
      </div>

      {/* 2. Interactive Surface Summary Cards with Category-Level Eye Toggles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
        {categories.map((cat) => {
          const isVis = isCategoryVisible(cat.regions);
          const isFull = isCategoryFullyVisible(cat.regions);
          const isFilterActive = activeFilter === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => handleCardFilterClick(cat.id)}
              className={`group relative p-2.5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                isFilterActive
                  ? cat.activeBg
                  : "bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              {/* Top Row: Label + Action Icons */}
              <div className="flex items-center justify-between gap-1">
                <span className={`text-[11px] font-extrabold uppercase tracking-wider ${cat.textColor}`}>
                  {cat.label}
                </span>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {/* Category Eye Toggle Button */}
                  <button
                    type="button"
                    onClick={() => onToggleCategory(cat.id)}
                    disabled={cat.count === 0}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                      isVis
                        ? "bg-indigo-600/30 text-white border-indigo-400/60 hover:bg-indigo-600 hover:border-indigo-400 shadow-sm"
                        : "bg-slate-800/80 text-slate-500 border-slate-700 hover:text-slate-200"
                    }`}
                    title={isVis ? `Hide all ${cat.label}` : `Show all ${cat.label}`}
                  >
                    {isVis ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>

                  {/* Category Solo Button (Show ONLY this category) */}
                  <button
                    type="button"
                    onClick={() => onShowOnlyCategory(cat.id)}
                    disabled={cat.count === 0}
                    className="w-6 h-6 rounded-lg flex items-center justify-center border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100"
                    title={`Isolate & Show ONLY ${cat.label}`}
                  >
                    <Focus className="w-3 h-3 text-indigo-300" />
                  </button>
                </div>
              </div>

              {/* Bottom Row: Count & Status */}
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-base font-black text-white font-mono">
                  {cat.count}
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  isVis ? "text-slate-300" : "text-slate-600"
                }`}>
                  {isFull ? "all on" : isVis ? "partial" : "hidden"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Filter & Visibility Control Toolbar */}
      <div className="space-y-2 shrink-0">
        <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-slate-950 border border-slate-700/80">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
            {filterTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-1 ring-indigo-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-850"
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold ${
                        isActive ? "bg-white/30 text-white" : "bg-slate-800 text-slate-200"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* If a filter is active, show quick Reset to All */}
          {activeFilter !== "all" && (
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-bold shrink-0 border border-slate-700"
            >
              <X className="w-3 h-3" />
              <span>Show All</span>
            </button>
          )}
        </div>

        {/* Visibility Action Controls */}
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-200 font-bold">
              {filteredRegions.length} surface card{filteredRegions.length === 1 ? "" : "s"} below:
            </span>
            {activeFilter !== "all" && (
              <button
                type="button"
                onClick={() => onShowOnlyCategory(activeFilter)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40 text-[11px] font-bold transition-all"
                title={`Show ONLY ${activeFilter}`}
              >
                <Focus className="w-3 h-3" />
                <span>Solo {activeFilter}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onShowAll}
              disabled={isAllVisible}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                isAllVisible
                  ? "bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed opacity-50"
                  : "bg-indigo-600/20 text-indigo-200 border-indigo-500/40 hover:bg-indigo-600 hover:text-white shadow-sm"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Show All</span>
            </button>

            <button
              type="button"
              onClick={onHideAll}
              disabled={isNoneVisible}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                isNoneVisible
                  ? "bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed opacity-50"
                  : "bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700 hover:text-white shadow-sm"
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Hide All</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Region Scroll List (Small Surface Cards) */}
      <div className="space-y-2 flex-1 min-h-[220px] overflow-y-auto pr-1">
        {filteredRegions.length === 0 ? (
          <div className="text-center py-8 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center">
            <SlidersHorizontal className="w-6 h-6 text-slate-500 mb-2" />
            <span className="text-xs text-slate-300 font-bold">No surfaces found for this filter</span>
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className="mt-2 text-xs text-indigo-300 hover:text-indigo-200 hover:underline font-extrabold"
            >
              Click here to view all surface cards
            </button>
          </div>
        ) : (
          filteredRegions.map((region) => (
            <RegionItem
              key={region.id}
              region={region}
              isVisible={visibleRegions.has(region.id)}
              isHovered={hoveredRegionId === region.id}
              onToggle={() => onToggleRegion(region.id)}
              onMouseEnter={() => onHoverRegion(region.id)}
              onMouseLeave={() => onHoverRegion(null)}
            />
          ))
        )}
      </div>

      {/* 5. Metrics Footer */}
      <div className="pt-2.5 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-300 font-mono shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-bold shadow-sm">
            {executionTimeMs ? `${executionTimeMs}ms` : "cached"}
          </span>
          {metadata?.device && (
            <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-700 uppercase text-slate-200 font-bold">
              {metadata.device}
            </span>
          )}
        </div>

        {metadata?.cached ? (
          <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            SHA-256 Cache Hit
          </span>
        ) : (
          <span className="text-xs text-slate-300 font-bold">
            {regions.length} surfaces parsed
          </span>
        )}
      </div>
    </div>
  );
}

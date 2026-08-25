"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { RoomUpload } from "./RoomUpload";
import { AnalysisProgress } from "./AnalysisProgress";
import { RoomImageViewer } from "./RoomImageViewer";
import { RegionList } from "./RegionList";

export function RoomAnalysisWorkspace({
  previewUrl,
  imageMeta,
  isAnalyzing,
  progressPercent,
  progressStage,
  error,
  analysisResult,
  visibleRegions,
  hoveredRegionId,
  setHoveredRegionId,
  onAnalyze,
  onToggleRegion,
  onToggleCategory,
  onShowOnlyCategory,
  onShowAll,
  onHideAll,
  onReset,
}) {
  return (
    <div className="w-full h-full min-h-0 flex flex-col">
      {/* Error Alert Box */}
      {error && (
        <div className="p-3 mb-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between animate-in fade-in duration-200 shrink-0">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="text-xs font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-xs font-bold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* 1. Upload View (Centered) */}
      {!previewUrl && !isAnalyzing && (
        <div className="flex-1 flex items-center justify-center min-h-0">
          <RoomUpload onUpload={onAnalyze} isAnalyzing={isAnalyzing} />
        </div>
      )}

      {/* 2. Loading / Analyzing State (Centered) */}
      {isAnalyzing && (
        <div className="flex-1 flex items-center justify-center min-h-0">
          <AnalysisProgress
            progressPercent={progressPercent}
            progressStage={progressStage}
          />
        </div>
      )}

      {/* 3. Rebalanced Result Split Workspace (Fits 100% viewport, zero scrolling needed) */}
      {previewUrl && analysisResult && !isAnalyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 min-h-0 h-full">
          {/* Left: Rebalanced Image Viewer (7 cols) */}
          <div className="lg:col-span-7 xl:col-span-7 h-full min-h-0 flex flex-col">
            <RoomImageViewer
              imageUrl={previewUrl}
              regions={analysisResult.regions || []}
              visibleRegions={visibleRegions}
              hoveredRegionId={hoveredRegionId}
              onHoverRegion={setHoveredRegionId}
            />
          </div>

          {/* Right: Spacious Detected Surfaces Panel (5 cols) */}
          <div className="lg:col-span-5 xl:col-span-5 h-full min-h-0 flex flex-col">
            <RegionList
              regions={analysisResult.regions || []}
              visibleRegions={visibleRegions}
              hoveredRegionId={hoveredRegionId}
              onToggleRegion={onToggleRegion}
              onToggleCategory={onToggleCategory}
              onShowOnlyCategory={onShowOnlyCategory}
              onHoverRegion={setHoveredRegionId}
              onShowAll={onShowAll}
              onHideAll={onHideAll}
              onReset={onReset}
              executionTimeMs={analysisResult.execution_time_ms}
              metadata={analysisResult.metadata}
            />
          </div>
        </div>
      )}
    </div>
  );
}

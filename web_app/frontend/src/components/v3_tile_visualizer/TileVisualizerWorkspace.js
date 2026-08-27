"use client";

import { useTileVisualizerV3 } from "@/hooks/useTileVisualizerV3";
import { SampleRoomGallery } from "./SampleRoomGallery";
import { TargetSelector } from "./TargetSelector";
import { TileCatalog } from "./TileCatalog";
import { TileRenderControls } from "./TileRenderControls";
import { TileCanvasViewer } from "./TileCanvasViewer";
import { Sparkles, Layers, Cpu, Compass } from "lucide-react";

export function TileVisualizerWorkspaceV3() {
  const {
    sampleRooms,
    presets,
    blendingEngines,
    blendingMode,
    setBlendingMode,
    selectedRoom,
    originalImage,
    surfaceType,
    setSurfaceType,
    confidence,
    setConfidence,
    customPrompt,
    setCustomPrompt,
    tileCatalog,
    selectedTileId,
    setSelectedTileId,
    selectedCategory,
    setSelectedCategory,
    renderOptions,
    setRenderOptions,
    isDetecting,
    isRendering,
    isUploading,
    surfaceMasks,
    compositeMaskBase64,
    renderedImageBase64,
    viewMode,
    setViewMode,
    splitPosition,
    setSplitPosition,
    statusMessage,
    executionTimeMs,
    detectedVanishingPoint,
    selectSampleRoom,
    uploadCustomRoom,
    detectSurface,
    renderTile,
    applyPreset,
  } = useTileVisualizerV3();

  const selectedTileMeta = tileCatalog.find((t) => t.id === selectedTileId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8 space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-3xl border border-indigo-500/20 shadow-2xl backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-mono text-[10px] font-black tracking-widest uppercase">
              V3.0 NEURAL PBR ENGINE
            </span>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              RANSAC Perspective Active
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <span>SAM 3 Room Tile Visualizer</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
              V3.0 Pro
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Physics-Based Rendering (PBR) tile visualizer powered by Meta SAM 3 open-vocabulary grounding, RANSAC camera vanishing point perspective, 3D normal bump mapping, and Schlick Fresnel window reflections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Camera Alignment
              </span>
              <span className="text-xs font-bold text-white font-mono">
                {detectedVanishingPoint ? `VP: (${detectedVanishingPoint[0]}, ${detectedVanishingPoint[1]})` : "Auto-RANSAC Ready"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout: Interactive Visualizer & Canvas on Top */}
      <div className="grid grid-cols-1 gap-6">
        {/* Central Visualizer Canvas & Inspection Viewer */}
        <TileCanvasViewer
          originalImage={originalImage}
          renderedImageBase64={renderedImageBase64}
          compositeMaskBase64={compositeMaskBase64}
          viewMode={viewMode}
          setViewMode={setViewMode}
          splitPosition={splitPosition}
          setSplitPosition={setSplitPosition}
          executionTimeMs={executionTimeMs}
          statusMessage={statusMessage}
          selectedTileName={selectedTileMeta?.name || selectedTileId}
          surfaceType={surfaceType}
          blendingMode={blendingMode}
          detectedVanishingPoint={detectedVanishingPoint}
        />

        {/* Section 1: Room Photo Gallery & Custom Upload */}
        <SampleRoomGallery
          sampleRooms={sampleRooms}
          selectedRoom={selectedRoom}
          onSelectRoom={selectSampleRoom}
          onUploadCustom={uploadCustomRoom}
          isUploading={isUploading}
        />

        {/* Section 2: SAM 3 Neural Surface Grounding */}
        <TargetSelector
          surfaceType={surfaceType}
          setSurfaceType={setSurfaceType}
          confidence={confidence}
          setConfidence={setConfidence}
          customPrompt={customPrompt}
          setCustomPrompt={setCustomPrompt}
          onDetect={detectSurface}
          isDetecting={isDetecting}
          hasMask={Boolean(compositeMaskBase64)}
          numRegions={surfaceMasks.length}
        />

        {/* Section 3: Architectural Tile Catalog (16 MyTyles Varieties) */}
        <TileCatalog
          catalog={tileCatalog}
          selectedTileId={selectedTileId}
          onSelectTile={setSelectedTileId}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Section 4: V3.0 PBR Lighting, RANSAC Perspective & Master Render */}
        <TileRenderControls
          renderOptions={renderOptions}
          setRenderOptions={setRenderOptions}
          presets={presets}
          onApplyPreset={applyPreset}
          blendingEngines={blendingEngines}
          blendingMode={blendingMode}
          setBlendingMode={setBlendingMode}
          onRender={renderTile}
          isRendering={isRendering}
          surfaceType={surfaceType}
          selectedTileId={selectedTileId}
          detectedVanishingPoint={detectedVanishingPoint}
        />
      </div>
    </div>
  );
}

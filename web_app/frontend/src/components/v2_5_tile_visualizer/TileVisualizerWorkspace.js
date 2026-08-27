"use client";

import { useTileVisualizer } from "@/hooks/useTileVisualizer";
import { SampleRoomGallery } from "./SampleRoomGallery";
import { TargetSelector } from "./TargetSelector";
import { TileCatalog } from "./TileCatalog";
import { TileRenderControls } from "./TileRenderControls";
import { TileCanvasViewer } from "./TileCanvasViewer";
import { Sparkles, Layers, ShieldCheck } from "lucide-react";

export function TileVisualizerWorkspace() {
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
    selectSampleRoom,
    uploadCustomRoom,
    detectSurface,
    renderTile,
    applyPreset,
  } = useTileVisualizer();

  const selectedTileMeta = tileCatalog.find((t) => t.id === selectedTileId);

  return (
    <div className="w-full space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>✨ Room Tile Visualizer</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-mono font-black border border-white/20 shadow-md">
                V2.5
              </span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            SAM 3 Neural Surface Segmentation &bull; 16 Architectural Tile Textures &bull; Photorealistic Perspective & Lighting Preservation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-indigo-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Multi-Signal SAM 3 Engine</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout: 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Canvas & Room Selector): 7 cols on lg, 7 cols on xl */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
          {/* Main Visualizer Canvas Viewer */}
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
          />

          {/* Step 1: Sample Home Gallery & Uploader */}
          <SampleRoomGallery
            sampleRooms={sampleRooms}
            selectedRoom={selectedRoom}
            onSelectSample={selectSampleRoom}
            onUploadCustom={uploadCustomRoom}
            isUploading={isUploading}
          />
        </div>

        {/* Right Column (Controls, Detection & Tile Catalog): 5 cols on lg, 5 cols on xl */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-4">
          {/* Step 2: Surface Selector & SAM 3 Trigger */}
          <TargetSelector
            surfaceType={surfaceType}
            setSurfaceType={setSurfaceType}
            confidence={confidence}
            setConfidence={setConfidence}
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
            onDetect={detectSurface}
            isDetecting={isDetecting}
            surfaceMasks={surfaceMasks}
            executionTimeMs={executionTimeMs}
          />

          {/* Step 3: 16 Tile Varieties Catalog */}
          <TileCatalog
            tileCatalog={tileCatalog}
            selectedTileId={selectedTileId}
            onSelectTile={(tileId) => {
              setSelectedTileId(tileId);
              renderTile(tileId);
            }}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Step 4: Fine-Tuning & Lighting Controls */}
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
          />
        </div>
      </div>
    </div>
  );
}

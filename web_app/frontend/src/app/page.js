"use client";

import { useState } from "react";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import { useSamSession } from "@/hooks/useSamSession";
import { Header } from "@/components/common/Header";
import { InteractiveCanvas } from "@/components/v1_manual/canvas/InteractiveCanvas";
import { CanvasControls } from "@/components/v1_manual/canvas/CanvasControls";
import { ControlPanel } from "@/components/v1_manual/panels/ControlPanel";
import { DetectedRegionPreview } from "@/components/v1_manual/preview/DetectedRegionPreview";
import { StatusLogger } from "@/components/v1_manual/metrics/StatusLogger";
import { apiClient } from "@/lib/api";

export default function HomePage() {
  const { health, isOnline, refetch } = useBackendHealth();
  const [isSwitchingDevice, setIsSwitchingDevice] = useState(false);

  const {
    originalImage,
    renderedImage,
    imageMeta,
    points,
    clickMode,
    setClickMode,
    textPrompt,
    setTextPrompt,
    confidence,
    setConfidence,
    activeTab,
    setActiveTab,
    cutoutImage,
    croppedCutout,
    maskOnlyImage,
    detectedRegions,
    lastPrompt,
    numDetected,
    isLoading,
    loadingText,
    isUploading,
    uploadProgress,
    uploadStage,
    statusLog,
    uploadImage,
    runTextPrompt,
    addPoint,
    undoPoint,
    clearPoints,
    resetAll,
  } = useSamSession();

  const hasImage = Boolean(originalImage);

  // Dynamic Device Switch Handler
  const handleSwitchDevice = async (targetDevice) => {
    try {
      setIsSwitchingDevice(true);
      const res = await apiClient.switchDevice(targetDevice);
      await refetch();
    } catch (err) {
      alert(`Could not switch device: ${err.message}`);
    } finally {
      setIsSwitchingDevice(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 1. Top Navbar Header with Hardware Device Switcher */}
      <Header
        health={health}
        isOnline={isOnline}
        onSwitchDevice={handleSwitchDevice}
        isSwitchingDevice={isSwitchingDevice}
        activeNav="manual"
      />

      {/* 2. Main Full-Width Workspace */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Top Hero Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text">
              ⚡ SAM 3 Vision Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Dual-Pane Open-Vocabulary Grounding & Interactive Point Segmentation Engine
            </p>
          </div>
        </div>

        {/* Workspace Layout: Left Canvas (8 cols on lg, 9 cols on xl) + Right Control Panel (4 cols on lg, 3 cols on xl) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Canvas Column (Expanded View) */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            <InteractiveCanvas
              originalImage={originalImage}
              renderedImage={renderedImage}
              points={points}
              clickMode={clickMode}
              isLoading={isLoading}
              loadingText={loadingText}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              uploadStage={uploadStage}
              activeTab={activeTab}
              onImageUpload={uploadImage}
              onAddPoint={addPoint}
            />

            <CanvasControls
              hasImage={hasImage}
              imageMeta={imageMeta}
              originalImage={originalImage}
              renderedImage={renderedImage}
              onReset={resetAll}
            />
          </div>

          {/* Right Control Sidebar Column */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-4 sticky top-20">
            <ControlPanel
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              hasImage={hasImage}
              textPrompt={textPrompt}
              setTextPrompt={setTextPrompt}
              confidence={confidence}
              setConfidence={setConfidence}
              onRunTextPrompt={runTextPrompt}
              points={points}
              clickMode={clickMode}
              setClickMode={setClickMode}
              onUndoPoint={undoPoint}
              onClearPoints={clearPoints}
              isLoading={isLoading || isUploading}
              onImageUpload={uploadImage}
            />
          </div>
        </div>

        {/* 3. Isolated Detected Region Preview & Export Center */}
        <DetectedRegionPreview
          hasImage={hasImage}
          originalImage={originalImage}
          cutoutImage={cutoutImage}
          croppedCutout={croppedCutout}
          maskOnlyImage={maskOnlyImage}
          detectedRegions={detectedRegions}
          lastPrompt={lastPrompt}
          numDetected={numDetected}
          imageMeta={imageMeta}
          isLoading={isLoading}
          loadingText={loadingText}
        />

        {/* 4. Bottom Execution Status & Metrics Logger */}
        <StatusLogger statusLog={statusLog} />
      </main>
    </div>
  );
}

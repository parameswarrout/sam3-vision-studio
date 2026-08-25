"use client";

import { useState } from "react";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import { useRoomAnalysis } from "@/hooks/useRoomAnalysis";
import { Header } from "@/components/common/Header";
import { RoomAnalysisWorkspace } from "@/components/v2_room_analysis/RoomAnalysisWorkspace";
import { apiClient } from "@/lib/api";

export default function RoomAnalysisPage() {
  const { health, isOnline, refetch } = useBackendHealth();
  const [isSwitchingDevice, setIsSwitchingDevice] = useState(false);

  const {
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
    analyzeImage,
    toggleRegion,
    toggleCategory,
    showOnlyCategory,
    showAllRegions,
    hideAllRegions,
    reset,
  } = useRoomAnalysis();

  const handleSwitchDevice = async (targetDevice) => {
    try {
      setIsSwitchingDevice(true);
      await apiClient.switchDevice(targetDevice);
      await refetch();
    } catch (err) {
      alert(`Could not switch device: ${err.message}`);
    } finally {
      setIsSwitchingDevice(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-950">
      {/* 1. Top Navbar Header with Navigation Tabs */}
      <Header
        health={health}
        isOnline={isOnline}
        onSwitchDevice={handleSwitchDevice}
        isSwitchingDevice={isSwitchingDevice}
        activeNav="room-analysis"
      />

      {/* 2. Main Full-Width Single-Screen Workspace (No page scrolling required) */}
      <main className="flex-1 w-full px-3 sm:px-5 lg:px-6 py-3 min-h-0 overflow-hidden flex flex-col">
        <RoomAnalysisWorkspace
          previewUrl={previewUrl}
          imageMeta={imageMeta}
          isAnalyzing={isAnalyzing}
          progressPercent={progressPercent}
          progressStage={progressStage}
          error={error}
          analysisResult={analysisResult}
          visibleRegions={visibleRegions}
          hoveredRegionId={hoveredRegionId}
          setHoveredRegionId={setHoveredRegionId}
          onAnalyze={analyzeImage}
          onToggleRegion={toggleRegion}
          onToggleCategory={toggleCategory}
          onShowOnlyCategory={showOnlyCategory}
          onShowAll={showAllRegions}
          onHideAll={hideAllRegions}
          onReset={reset}
        />
      </main>
    </div>
  );
}

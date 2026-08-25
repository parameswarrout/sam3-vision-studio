"use client";

import { useState, useEffect } from "react";
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

  // Global Keyboard Shortcuts (Space to toggle all, 1-5 for quick filter solo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input field
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (visibleRegions.size > 0) {
          hideAllRegions();
        } else {
          showAllRegions();
        }
      } else if (e.key === "1") {
        showAllRegions();
      } else if (e.key === "2") {
        showOnlyCategory("wall");
      } else if (e.key === "3") {
        showOnlyCategory("floor");
      } else if (e.key === "4") {
        showOnlyCategory("openings");
      } else if (e.key === "5") {
        showOnlyCategory("furniture");
      } else if (e.key === "Escape") {
        setHoveredRegionId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visibleRegions, showAllRegions, hideAllRegions, showOnlyCategory, setHoveredRegionId]);

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

      {/* 2. Main Full-Width Single-Screen Workspace with Balanced Margins */}
      <main className="flex-1 w-full px-6 sm:px-10 lg:px-12 py-3 min-h-0 overflow-hidden flex flex-col">
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

"use client";

import { useState } from "react";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import { Header } from "@/components/common/Header";
import { TileVisualizerWorkspace } from "@/components/v2_5_tile_visualizer/TileVisualizerWorkspace";
import { apiClient } from "@/lib/api";

export default function TileVisualizerPage() {
  const { health, isOnline, refetch } = useBackendHealth();
  const [isSwitchingDevice, setIsSwitchingDevice] = useState(false);

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
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* 1. Top Navbar Header */}
      <Header
        health={health}
        isOnline={isOnline}
        onSwitchDevice={handleSwitchDevice}
        isSwitchingDevice={isSwitchingDevice}
        activeNav="tile-visualizer"
      />

      {/* 2. Main Visualizer Container */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-5">
        <TileVisualizerWorkspace />
      </main>
    </div>
  );
}

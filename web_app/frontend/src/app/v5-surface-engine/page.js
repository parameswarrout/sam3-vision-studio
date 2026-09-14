"use client";

import { useState } from "react";
import { Header } from "@/components/common/Header";
import { V5SurfaceWorkspace } from "@/components/v5_surface_engine/V5SurfaceWorkspace";
import { useBackendHealth } from "@/hooks/useBackendHealth";

export default function V5SurfaceEnginePage() {
  const { health, isOnline, switchDevice, isSwitchingDevice } = useBackendHealth();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Universal App Navigation Bar */}
      <Header
        health={health}
        isOnline={isOnline}
        onSwitchDevice={switchDevice}
        isSwitchingDevice={isSwitchingDevice}
        activeNav="v5-surface-engine"
      />

      {/* Main Studio Content */}
      <div className="flex-1 flex flex-col">
        <V5SurfaceWorkspace />
      </div>
    </main>
  );
}

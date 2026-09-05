"use client";

import { useState } from "react";
import { Sparkles, Upload, Image as ImageIcon, ShieldCheck, Layers, Info } from "lucide-react";
import { useV5SurfaceEngine } from "@/hooks/useV5SurfaceEngine";
import { PBRControlPanel } from "./PBRControlPanel";
import { DiagnosticViewers } from "./DiagnosticViewers";
import { QualityMetricsModal } from "./QualityMetricsModal";

const SAMPLES = [
  { id: "living_room", name: "Modern Living Room", path: "/samples/living_room.jpg" },
  { id: "bedroom", name: "Minimalist Bedroom", path: "/samples/bedroom.jpg" },
  { id: "kitchen", name: "Luxury Kitchen", path: "/samples/kitchen.jpg" },
];

export function V5SurfaceWorkspace() {
  const engine = useV5SurfaceEngine();
  const [currentImageSrc, setCurrentImageSrc] = useState("/samples/living_room.jpg");
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);

  // Handle local image file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        setCurrentImageSrc(reader.result);
        engine.clearPoints();
        // Upload to SAM 3 session backend
        const formData = new FormData();
        formData.append("file", file);
        try {
          await fetch("/api/v1/image", { method: "POST", body: formData });
        } catch (err) {
          console.error("Image upload failed", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Select sample photo
  const handleSelectSample = async (sample) => {
    setCurrentImageSrc(sample.path);
    engine.clearPoints();
    try {
      const res = await fetch(sample.path);
      const blob = await res.blob();
      const file = new File([blob], `${sample.id}.jpg`, { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("file", file);
      await fetch("/api/v1/image", { method: "POST", body: formData });
    } catch (err) {
      console.error("Sample upload failed", err);
    }
  };

  const handleRender = () => {
    engine.renderReplacement(currentImageSrc);
  };

  const handleDetect = () => {
    engine.detectSurface(currentImageSrc);
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto p-4 sm:p-6 space-y-6">
      {/* Performance Warning Alert Banner */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-semibold shadow-lg">
        <span className="text-base shrink-0">⚠️</span>
        <span>
          <strong>Notice:</strong> This tab is <strong>not working as expected / underperforming</strong>. Geometry estimation and segmentation accuracy may be inconsistent on certain scenes.
        </span>
      </div>

      {/* Top Banner with Engineering Philosophy Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="font-black text-xl text-white tracking-tight">
              Physically-Based Room Surface Replacement Engine
            </h1>
            <span className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30">
              V5.0 DETERMINISTIC GRAPHICS
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Deterministic 5-stage vision + graphics pipeline: SAM 3 prompt voting & alpha matting → 3D RANSAC plane fit → learned intrinsic decomposition → authored PBR materials → Cook-Torrance GGX relighting & boundary-only seam blending.
          </p>
        </div>

        {/* Sample Room Quick Pick */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 hidden sm:inline">Samples:</span>
          {SAMPLES.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectSample(s)}
              className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all shadow-sm"
            >
              {s.name}
            </button>
          ))}

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Main Studio 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Viewport & Diagnostics (7 cols) */}
        <div className="lg:col-span-7 h-[700px]">
          <DiagnosticViewers
            originalImage={currentImageSrc}
            renderedImage={engine.renderedImage}
            diagnostics={engine.diagnostics}
            activeTab={engine.activeDiagnosticTab}
            onTabChange={engine.setActiveDiagnosticTab}
            promptPoints={engine.promptPoints}
            onAddPoint={engine.addPoint}
            onClearPoints={engine.clearPoints}
            detectedMaskOverlay={engine.detectedMaskOverlay}
            isDetecting={engine.isDetecting}
            onDetectSurface={handleDetect}
          />
        </div>

        {/* Right Column: PBR Controls & SKU Catalog (5 cols) */}
        <div className="lg:col-span-5 h-[700px]">
          <PBRControlPanel
            catalog={engine.catalog}
            selectedTileId={engine.selectedTileId}
            onSelectTile={engine.setSelectedTileId}
            surfaceType={engine.surfaceType}
            onChangeSurfaceType={engine.setSurfaceType}
            customPrompt={engine.customPrompt}
            onChangeCustomPrompt={engine.setCustomPrompt}
            scale={engine.scale}
            onChangeScale={engine.setScale}
            rotationDeg={engine.rotationDeg}
            onChangeRotation={engine.setRotationDeg}
            bumpStrength={engine.bumpStrength}
            onChangeBumpStrength={engine.setBumpStrength}
            groutWidthMm={engine.groutWidthMm}
            onChangeGroutWidth={engine.setGroutWidthMm}
            seamBlendRadius={engine.seamBlendRadius}
            onChangeSeamBlendRadius={engine.setSeamBlendRadius}
            applyGeometricFeedback={engine.applyGeometricFeedback}
            onToggleGeometricFeedback={engine.setApplyGeometricFeedback}
            isRendering={engine.isRendering}
            onRender={handleRender}
            onOpenMetrics={() => setIsMetricsOpen(true)}
            hasMetrics={Boolean(engine.metrics)}
          />
        </div>
      </div>

      {/* Live Numeric Metrics Modal */}
      <QualityMetricsModal
        metrics={engine.metrics}
        timings={engine.timings}
        planeEquation={engine.planeEquation}
        lightParams={engine.lightParams}
        isOpen={isMetricsOpen}
        onClose={() => setIsMetricsOpen(false)}
      />
    </div>
  );
}

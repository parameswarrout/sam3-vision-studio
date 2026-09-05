"use client";

import { useGenerativeStudio } from "@/hooks/useGenerativeStudio";
import { StylePresetGallery } from "./StylePresetGallery";
import { PromptBuilderControls } from "./PromptBuilderControls";
import { GenerativeCanvasViewer } from "./GenerativeCanvasViewer";
import { Sparkles, Cpu, Upload, Image as ImageIcon } from "lucide-react";
import { useRef } from "react";

export function GenerativeStudioWorkspace() {
  const {
    sampleRooms,
    selectedRoom,
    originalImage,
    stylePresets,
    selectedPresetId,
    setSelectedPresetId,
    customPrompt,
    setCustomPrompt,
    negativePrompt,
    setNegativePrompt,
    strength,
    setStrength,
    guidanceScale,
    setGuidanceScale,
    numInferenceSteps,
    setNumInferenceSteps,
    maskMode,
    setMaskMode,
    isGenerating,
    generatedImageBase64,
    viewMode,
    setViewMode,
    splitPosition,
    setSplitPosition,
    statusMessage,
    executionTimeMs,
    selectSampleRoom,
    uploadCustomRoom,
    generateRestyle,
  } = useGenerativeStudio();

  const fileInputRef = useRef(null);
  const activePreset = stylePresets.find((p) => p.id === selectedPresetId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8 space-y-6">
      {/* Performance Warning Alert Banner */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-semibold shadow-lg">
        <span className="text-base shrink-0">⚠️</span>
        <span>
          <strong>Notice:</strong> This tab is <strong>not working as expected / underperforming</strong>. Features here may experience synthesis inaccuracies or slow CPU execution.
        </span>
      </div>

      {/* Top Banner & Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 p-6 rounded-3xl border border-pink-500/20 shadow-2xl backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-mono text-[10px] font-black tracking-widest uppercase">
              V4.0 GENERATIVE DIFFUSION STUDIO
            </span>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              CPU Multi-Threading Ready
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <span>SAM 3 AI Generative Interior Studio</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-400">
              V4.0
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
            CPU-Optimized Latent Diffusion Inpainting & Architectural Restyling. Synthesizes photorealistic materials, designer furniture, and natural raytraced daylight using PyTorch multi-threading and DPM++ Karras schedulers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Compute Engine
              </span>
              <span className="text-xs font-bold text-white font-mono">
                PyTorch CPU (8 Threads)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Generative Canvas Viewer */}
        <GenerativeCanvasViewer
          originalImage={originalImage}
          generatedImageBase64={generatedImageBase64}
          viewMode={viewMode}
          setViewMode={setViewMode}
          splitPosition={splitPosition}
          setSplitPosition={setSplitPosition}
          executionTimeMs={executionTimeMs}
          statusMessage={statusMessage}
          styleName={activePreset?.name || "Architectural Restyle"}
        />

        {/* Room Photo Picker & Custom Upload */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                ROOM ENVIRONMENT
              </span>
              <h2 className="text-lg font-black text-white flex items-center gap-2 mt-1">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>Select Room Photo</span>
              </h2>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    uploadCustomRoom(e.target.files[0]);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Custom Room</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {sampleRooms.map((room) => {
              const isSelected = selectedRoom?.id === room.id;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => selectSampleRoom(room)}
                  className={`group text-left p-2 rounded-2xl border transition-all relative overflow-hidden flex flex-col gap-2 ${
                    isSelected
                      ? "bg-indigo-950/50 border-pink-500 shadow-lg ring-2 ring-pink-500/40"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-900">
                    <img
                      src={room.image}
                      alt={room.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-pink-400 font-black uppercase block">
                      {room.category}
                    </span>
                    <h3 className="text-xs font-bold text-white truncate">{room.title}</h3>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Style Preset Gallery */}
        <StylePresetGallery
          presets={stylePresets}
          selectedPresetId={selectedPresetId}
          onSelectPreset={setSelectedPresetId}
        />

        {/* Prompt Builder & CPU Inference Controls */}
        <PromptBuilderControls
          customPrompt={customPrompt}
          setCustomPrompt={setCustomPrompt}
          negativePrompt={negativePrompt}
          setNegativePrompt={setNegativePrompt}
          strength={strength}
          setStrength={setStrength}
          guidanceScale={guidanceScale}
          setGuidanceScale={setGuidanceScale}
          numInferenceSteps={numInferenceSteps}
          setNumInferenceSteps={setNumInferenceSteps}
          maskMode={maskMode}
          setMaskMode={setMaskMode}
          onGenerate={generateRestyle}
          isGenerating={isGenerating}
          selectedPresetId={selectedPresetId}
        />
      </div>
    </div>
  );
}

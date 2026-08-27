"use client";

import { Sliders, Wand2, Cpu, Loader2, Sparkles, Layers } from "lucide-react";

export function PromptBuilderControls({
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
  onGenerate,
  isGenerating,
  selectedPresetId,
}) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono font-black uppercase tracking-widest text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
            DIFFUSION CONTROLS
          </span>
          <h2 className="text-lg font-black text-white flex items-center gap-2 mt-1">
            <Sliders className="w-4 h-4 text-pink-400" />
            <span>Prompt Architect & CPU Tuning</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
            <Cpu className="w-3.5 h-3.5" />
            <span>8-Core CPU DPM++ Karras</span>
          </span>
        </div>
      </div>

      {/* Mode Selector: Surface-Only Inpainting vs Full Scene Restyling */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 block">
          Inpainting Target Envelope
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMaskMode("surface_only")}
            className={`p-3 rounded-2xl border text-left transition-all ${
              maskMode === "surface_only"
                ? "bg-pink-950/30 border-pink-500 text-white ring-1 ring-pink-500/40"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <Layers className="w-3.5 h-3.5 text-pink-400" />
              <span>SAM 3 Surface Inpainting</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Restyles only the segmented floors, walls, and tile surfaces while keeping ceiling & windows locked.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMaskMode("full_scene")}
            className={`p-3 rounded-2xl border text-left transition-all ${
              maskMode === "full_scene"
                ? "bg-purple-950/30 border-purple-500 text-white ring-1 ring-purple-500/40"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Full Scene Architectural Restyle</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Generates a complete architectural makeover with new furniture, lighting fixtures, and decor.
            </p>
          </button>
        </div>
      </div>

      {/* Custom Prompt Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>Custom Positive Prompt (Optional Additions)</span>
            <span className="text-[10px] text-slate-400 font-mono">Appended to style preset</span>
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. Add a large fiddle leaf fig plant in the corner, soft sunlight, brass chandelier..."
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>Negative Prompt (Avoidances)</span>
            <span className="text-[10px] text-slate-400 font-mono">Excluded artifacts</span>
          </label>
          <textarea
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="e.g. cluttered wires, blurry textures, distorted furniture..."
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Sliders: Denoising Strength & Guidance Scale */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-300">Denoising Strength</span>
            <span className="font-mono text-pink-400">{Math.round(strength * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.3"
            max="1.0"
            step="0.05"
            value={strength}
            onChange={(e) => setStrength(parseFloat(e.target.value))}
            className="w-full accent-pink-500 cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block">
            Higher = more creative AI transformation
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-300">Prompt Adherence (CFG)</span>
            <span className="font-mono text-purple-400">{guidanceScale.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="3.0"
            max="15.0"
            step="0.5"
            value={guidanceScale}
            onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block">
            Controls how strictly AI follows text prompts
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-300">Inference Steps (CPU)</span>
            <span className="font-mono text-emerald-400">{numInferenceSteps} Steps</span>
          </div>
          <input
            type="range"
            min="10"
            max="30"
            step="2"
            value={numInferenceSteps}
            onChange={(e) => setNumInferenceSteps(parseInt(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block">
            15–20 steps recommended for fast CPU rendering
          </span>
        </div>
      </div>

      {/* Master Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm md:text-base shadow-xl shadow-pink-900/30 flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating AI Photorealistic Room on CPU... (Please Wait)</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 text-pink-200" />
              <span>✨ Generate AI Room Restyle (CPU Latent Diffusion)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

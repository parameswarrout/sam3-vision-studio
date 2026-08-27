"use client";

import { Sparkles, CheckCircle2, SunMedium } from "lucide-react";

export function StylePresetGallery({
  presets = [],
  selectedPresetId,
  onSelectPreset,
}) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-black uppercase tracking-widest text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
            ARCHITECTURAL MOODBOARD
          </span>
          <h2 className="text-lg font-black text-white flex items-center gap-2 mt-1">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>Select Interior Design Style</span>
          </h2>
          <p className="text-xs text-slate-400">
            Pick a curated interior architectural style preset to guide the Latent Diffusion engine.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
        {presets.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.id)}
              className={`group text-left p-3.5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between gap-3 ${
                isSelected
                  ? "bg-gradient-to-b from-pink-950/40 via-purple-950/30 to-slate-900 border-pink-500 shadow-lg shadow-pink-950/50 ring-2 ring-pink-500/40"
                  : "bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-black font-mono uppercase px-2 py-0.5 rounded-md border"
                  style={{
                    backgroundColor: `${preset.accent_color}15`,
                    color: preset.accent_color,
                    borderColor: `${preset.accent_color}40`,
                  }}
                >
                  {preset.badge}
                </span>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-black text-white group-hover:text-pink-300 transition-colors">
                  {preset.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                <SunMedium className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{preset.lighting_style}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

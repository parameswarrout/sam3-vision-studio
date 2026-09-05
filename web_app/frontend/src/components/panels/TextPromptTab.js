"use client";

import { Sparkles, Sliders, ArrowRight } from "lucide-react";
import { SAMPLE_PROMPTS } from "@/lib/constants";

export function TextPromptTab({
  textPrompt,
  setTextPrompt,
  confidence,
  setConfidence,
  onRun,
  isLoading,
  hasImage,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLoading && hasImage) {
      onRun();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 1. Text Prompt Input */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Concept / Query Prompt
        </label>
        <div className="relative">
          <input
            type="text"
            value={textPrompt}
            onChange={(e) => setTextPrompt(e.target.value)}
            placeholder="e.g. 'person', 'red sports car', 'sunglasses'..."
            disabled={isLoading || !hasImage}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
          />
        </div>
      </div>

      {/* 2. Quick Suggestions Chips */}
      <div>
        <span className="text-[11px] font-medium text-slate-400 block mb-2">Quick Suggestions:</span>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={isLoading || !hasImage}
              onClick={() => {
                setTextPrompt(prompt);
                onRun(prompt, confidence);
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50 hover:border-indigo-500/50 transition-all disabled:opacity-40"
            >
              +{prompt}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Confidence Threshold Slider */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            Confidence Threshold
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setConfidence(0.70)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all font-semibold"
              title="Reset to Max (0.70)"
            >
              Max
            </button>
            <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {confidence.toFixed(2)}
            </span>
          </div>
        </div>
        <input
          type="range"
          min="0.01"
          max="0.70"
          step="0.01"
          value={confidence}
          onChange={(e) => setConfidence(parseFloat(e.target.value))}
          disabled={isLoading || !hasImage}
          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-40"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>0.01 (More objects)</span>
          <span>0.70 (Strict)</span>
        </div>
      </div>

      {/* 4. Action Button */}
      <button
        type="submit"
        disabled={isLoading || !hasImage || !textPrompt.trim()}
        className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
      >
        <Sparkles className="w-4 h-4" />
        <span>Segment Concepts</span>
        <ArrowRight className="w-4 h-4 ml-auto opacity-70" />
      </button>
    </form>
  );
}

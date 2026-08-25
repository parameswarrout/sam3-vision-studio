"use client";

import { Sparkles } from "lucide-react";

const EXAMPLES = [
  {
    title: "Grocery Items",
    prompt: "fruit",
    file: "/samples/groceries.jpg",
  },
  {
    title: "Off-road Truck",
    prompt: "wheel",
    file: "/samples/truck.jpg",
  },
  {
    title: "Street Scene",
    prompt: "person",
    file: "/samples/test_image.jpg",
  },
];

export function ExampleGallery({ onSelectExample, disabled }) {
  return (
    <div className="rounded-2xl glass-panel p-4 border border-white/10 space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Quick Examples (Gradio Presets)
        </span>
        <span className="text-slate-500 text-[11px]">Click to load image & sample prompt</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {EXAMPLES.map((item, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectExample(item.file, item.title, item.prompt)}
            className="group relative rounded-xl overflow-hidden border border-slate-700/60 hover:border-indigo-500 bg-slate-900 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/20 active:scale-98"
          >
            <div className="aspect-video w-full overflow-hidden bg-slate-950">
              <img
                src={item.file}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-2 bg-slate-900/90 border-t border-slate-800">
              <span className="font-semibold text-xs text-slate-200 block truncate group-hover:text-indigo-300">
                {item.title}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                Prompt: "{item.prompt}"
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

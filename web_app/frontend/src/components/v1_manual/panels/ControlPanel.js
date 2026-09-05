"use client";

import { Sparkles, MousePointer, Image as ImageIcon } from "lucide-react";
import { TextPromptTab } from "./TextPromptTab";
import { PointPromptTab } from "./PointPromptTab";

export function ControlPanel({
  activeTab,
  setActiveTab,
  hasImage,
  textPrompt,
  setTextPrompt,
  confidence,
  setConfidence,
  onRunTextPrompt,
  points,
  clickMode,
  setClickMode,
  onUndoPoint,
  onClearPoints,
  isLoading,
  onImageUpload,
}) {
  return (
    <div className="w-full rounded-2xl glass-panel p-5 flex flex-col gap-5 border border-white/10">
      {/* 1. Header Tabs Selector */}
      <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
        <button
          onClick={() => setActiveTab("text")}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "text"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Text Prompt</span>
        </button>

        <button
          onClick={() => setActiveTab("point")}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "point"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>Interactive Points</span>
        </button>
      </div>

      {/* 2. Active Tab Content */}
      <div className="flex-1">
        {activeTab === "text" ? (
          <TextPromptTab
            textPrompt={textPrompt}
            setTextPrompt={setTextPrompt}
            confidence={confidence}
            setConfidence={setConfidence}
            onRun={onRunTextPrompt}
            isLoading={isLoading}
            hasImage={hasImage}
            onImageUpload={onImageUpload}
          />
        ) : (
          <PointPromptTab
            points={points}
            clickMode={clickMode}
            setClickMode={setClickMode}
            onUndo={onUndoPoint}
            onClear={onClearPoints}
            isLoading={isLoading}
            hasImage={hasImage}
          />
        )}
      </div>

      {/* 3. Bottom Replace Image Quick Action */}
      {hasImage && (
        <div className="pt-3 border-t border-slate-800/80">
          <label className="cursor-pointer w-full py-2.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 font-medium text-xs flex items-center justify-center gap-2 transition-all block text-center">
            <ImageIcon className="w-3.5 h-3.5 inline" />
            <span>Change Active Image</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) onImageUpload(e.target.files[0]);
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}

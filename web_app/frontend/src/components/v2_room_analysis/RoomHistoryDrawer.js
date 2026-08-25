"use client";

import { useState, useEffect } from "react";
import {
  History,
  X,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Database,
  Layers,
} from "lucide-react";
import { apiClient } from "@/lib/api";

export function RoomHistoryDrawer({ isOpen, onClose, onSelectRoom }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.getRoomHistory(50, 0);
      setHistoryItems(res.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const handleDelete = async (e, roomId) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this saved analysis?")) return;

    try {
      setDeletingId(roomId);
      await apiClient.deleteSavedRoom(roomId);
      setHistoryItems((prev) => prev.filter((item) => item.id !== roomId));
    } catch (err) {
      alert(`Could not delete: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-full max-w-md bg-slate-900/95 border-l border-slate-700/80 shadow-2xl h-full flex flex-col z-10">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-700/80 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Saved Analyses History</h3>
              <p className="text-[11px] text-slate-400">SQLite Database • 0ms Recall</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={fetchHistory}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50"
              title="Refresh history"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List of Saved Rooms */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {isLoading && historyItems.length === 0 && (
            <div className="text-center py-16 text-slate-400 flex flex-col items-center">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
              <span className="text-xs">Loading database records...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {!isLoading && historyItems.length === 0 && (
            <div className="text-center py-20 text-slate-500 flex flex-col items-center">
              <Layers className="w-8 h-8 text-slate-600 mb-2" />
              <span className="text-sm font-bold text-slate-400">No saved rooms yet</span>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Upload and analyze any room photo. It will automatically be saved here for instant 0ms recall.
              </p>
            </div>
          )}

          {historyItems.map((item) => {
            const isDeleting = deletingId === item.id;
            const dateStr = item.created_at
              ? new Date(item.created_at).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recent";

            return (
              <div
                key={item.id}
                onClick={() => onSelectRoom(item)}
                className={`group relative p-2.5 rounded-2xl border border-slate-700/80 bg-slate-950/80 hover:bg-slate-850 hover:border-indigo-400 transition-all duration-200 cursor-pointer shadow-md flex items-center gap-3 ${
                  isDeleting ? "opacity-40 pointer-events-none" : ""
                }`}
              >
                {/* Thumbnail */}
                <div className="w-20 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0 relative">
                  {item.thumbnail_base64 ? (
                    <img
                      src={item.thumbnail_base64}
                      alt={item.room_title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Layers className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">
                      {item.room_title}
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-500/30 shrink-0">
                      {Math.round(item.overall_confidence * 100)}%
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {item.wall_count} Walls • {item.floor_count} Floor • {item.total_surfaces} Total
                  </p>

                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {dateStr}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, item.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100"
                      title="Delete analysis"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-slate-700/80 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>{historyItems.length} Sessions Stored</span>
          <span className="text-indigo-400 font-bold">WAL Mode Active</span>
        </div>
      </div>
    </div>
  );
}

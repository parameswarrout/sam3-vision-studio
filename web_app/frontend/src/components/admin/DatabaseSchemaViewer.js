"use client";

import { useState, useEffect } from "react";
import {
  Database,
  Table,
  Link as LinkIcon,
  Key,
  ArrowRight,
  RefreshCw,
  Search,
  Layers,
  Users,
  FolderArchive,
  Cpu,
  FileSpreadsheet,
  CheckCircle2,
  HardDrive,
  Info,
} from "lucide-react";
import { apiClient } from "@/lib/api";

const SCHEMA_DEFINITIONS = [
  {
    table: "users",
    title: "User & Studio Accounts",
    icon: Users,
    color: "from-indigo-600 to-indigo-900",
    border: "border-indigo-500/40",
    description: "Core authentication entity for multi-tenant studio accounts, roles & credentials.",
    columns: [
      { name: "id", type: "UUID (PK)", isPk: true, desc: "Primary Key" },
      { name: "email", type: "VARCHAR(255)", desc: "Unique login username/email" },
      { name: "hashed_password", type: "VARCHAR(255)", desc: "Bcrypt (12 rounds)" },
      { name: "full_name", type: "VARCHAR(120)", desc: "Display full name" },
      { name: "role", type: "VARCHAR(30)", desc: "'admin', 'architect', 'client'" },
      { name: "avatar_url", type: "VARCHAR(500)", desc: "Custom face portrait image" },
      { name: "is_active", type: "BOOLEAN", desc: "Account active flag" },
      { name: "last_login_at", type: "DATETIME", desc: "Last login timestamp" },
      { name: "created_at", type: "DATETIME", desc: "Record creation UTC" },
    ],
    relations: [
      { to: "projects", type: "1 : N", fk: "projects.user_id", note: "User owns multiple projects (Cascade Delete)" },
      { to: "room_sessions", type: "1 : N", fk: "room_sessions.user_id", note: "User creates room analyses" },
      { to: "user_login_audits", type: "1 : N", fk: "user_login_audits.user_id", note: "Tracks user logins" },
    ],
  },
  {
    table: "projects",
    title: "Architectural Projects",
    icon: FolderArchive,
    color: "from-sky-600 to-sky-900",
    border: "border-sky-500/40",
    description: "Architectural project groupings (e.g., 'Downtown Penthouse', 'Villa Aurora').",
    columns: [
      { name: "id", type: "UUID (PK)", isPk: true, desc: "Primary Key" },
      { name: "user_id", type: "UUID (FK)", isFk: true, ref: "users.id", desc: "Owner user UUID" },
      { name: "name", type: "VARCHAR(150)", desc: "Project title" },
      { name: "description", type: "TEXT", desc: "Project details & notes" },
      { name: "created_at", type: "DATETIME", desc: "Creation timestamp" },
    ],
    relations: [
      { to: "room_sessions", type: "1 : N", fk: "room_sessions.project_id", note: "Project contains analyzed rooms" },
    ],
  },
  {
    table: "room_sessions",
    title: "Analyzed Room Sessions",
    icon: Layers,
    color: "from-cyan-600 to-cyan-900",
    border: "border-cyan-500/40",
    description: "Core AI room scene analyses, visual metrics, dimensions & confidence scores.",
    columns: [
      { name: "id", type: "UUID (PK)", isPk: true, desc: "Primary Key" },
      { name: "project_id", type: "UUID (FK)", isFk: true, ref: "projects.id", desc: "Parent project UUID" },
      { name: "user_id", type: "UUID (FK)", isFk: true, ref: "users.id", desc: "Author user UUID" },
      { name: "image_hash", type: "VARCHAR(64)", desc: "SHA-256 image dedup key" },
      { name: "room_title", type: "VARCHAR(150)", desc: "Scene name (e.g. Master Bedroom)" },
      { name: "image_width", type: "INTEGER", desc: "Original photo width" },
      { name: "image_height", type: "INTEGER", desc: "Original photo height" },
      { name: "overall_confidence", type: "FLOAT", desc: "SAM 3 model confidence (0.0 - 1.0)" },
      { name: "wall_count", type: "INTEGER", desc: "Detected walls" },
      { name: "floor_count", type: "INTEGER", desc: "Detected floors/ceilings" },
      { name: "total_surfaces", type: "INTEGER", desc: "Total segmented objects" },
      { name: "created_at", type: "DATETIME", desc: "Analysis timestamp" },
    ],
    relations: [
      { to: "surface_regions", type: "1 : N", fk: "surface_regions.room_session_id", note: "Room has multiple surface polygon masks (Cascade Delete)" },
      { to: "gpu_tensor_artifacts", type: "1 : 1", fk: "gpu_tensor_artifacts.room_session_id", note: "Room has 1 compressed GPU tensor bundle (Cascade Delete)" },
    ],
  },
  {
    table: "surface_regions",
    title: "Surface Region Masks",
    icon: Table,
    color: "from-emerald-600 to-emerald-900",
    border: "border-emerald-500/40",
    description: "Segmented surface boundaries, polygon masks, labels & surface area ratios.",
    columns: [
      { name: "id", type: "UUID (PK)", isPk: true, desc: "Primary Key" },
      { name: "room_session_id", type: "UUID (FK)", isFk: true, ref: "room_sessions.id", desc: "Parent Room UUID" },
      { name: "surface_type", type: "VARCHAR(50)", desc: "wall, floor, opening, fixture" },
      { name: "label", type: "VARCHAR(100)", desc: "Semantic label (e.g. Feature Wall)" },
      { name: "confidence", type: "FLOAT", desc: "Mask confidence score" },
      { name: "area_ratio", type: "FLOAT", desc: "Room coverage %" },
      { name: "color_hex", type: "VARCHAR(7)", desc: "Visual display hex color" },
      { name: "plane_index", type: "INTEGER", desc: "3D plane index" },
      { name: "needs_review", type: "BOOLEAN", desc: "Architect review flag" },
      { name: "created_at", type: "DATETIME", desc: "Creation timestamp" },
    ],
    relations: [],
  },
  {
    table: "gpu_tensor_artifacts",
    title: "GPU Tensor Storage",
    icon: Cpu,
    color: "from-purple-600 to-purple-900",
    border: "border-purple-500/40",
    description: "Compressed ViT embeddings, depth arrays, and 3D surface normal tensors in .npz format.",
    columns: [
      { name: "id", type: "UUID (PK)", isPk: true, desc: "Primary Key" },
      { name: "room_session_id", type: "UUID (FK)", isFk: true, ref: "room_sessions.id", desc: "Parent Room UUID" },
      { name: "storage_backend", type: "VARCHAR(20)", desc: "local / s3 / r2" },
      { name: "tensor_uri", type: "VARCHAR(500)", desc: "Path to .npz file" },
      { name: "file_size_bytes", type: "INTEGER", desc: "Archive size in bytes" },
      { name: "vit_tensor_shape", type: "VARCHAR(100)", desc: "e.g. [1, 256, 64, 64]" },
      { name: "depth_shape", type: "VARCHAR(100)", desc: "e.g. [1, 1024, 1024]" },
      { name: "normals_shape", type: "VARCHAR(100)", desc: "e.g. [3, 1024, 1024]" },
      { name: "compression", type: "VARCHAR(20)", desc: "npz_zip" },
      { name: "compute_device", type: "VARCHAR(30)", desc: "cuda / cpu" },
      { name: "created_at", type: "DATETIME", desc: "Creation timestamp" },
    ],
    relations: [],
  },
  {
    table: "user_login_audits",
    title: "Security & Login Audits",
    icon: Database,
    color: "from-rose-600 to-rose-900",
    border: "border-rose-500/40",
    description: "Security access log of all login attempts, client IP addresses & browsers.",
    columns: [
      { name: "id", type: "UUID (PK)", isPk: true, desc: "Primary Key" },
      { name: "user_id", type: "UUID (FK)", isFk: true, ref: "users.id", desc: "User UUID if found" },
      { name: "username_or_email", type: "VARCHAR(255)", desc: "Attempted username" },
      { name: "role", type: "VARCHAR(30)", desc: "Role at time of login" },
      { name: "status", type: "VARCHAR(20)", desc: "SUCCESS / FAILED" },
      { name: "ip_address", type: "VARCHAR(45)", desc: "Client IP (IPv4/IPv6)" },
      { name: "user_agent", type: "VARCHAR(500)", desc: "Browser / OS agent" },
      { name: "created_at", type: "DATETIME", desc: "Attempt timestamp" },
    ],
    relations: [],
  },
];

export function DatabaseSchemaViewer({ token, dbInfo }) {
  const [selectedTable, setSelectedTable] = useState("users");
  const [tableData, setTableData] = useState(null);
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [viewMode, setViewMode] = useState("erd"); // 'erd' | 'browser'

  const fetchTableData = async (tableName) => {
    try {
      setIsLoadingTable(true);
      const res = await apiClient.getTableData(token, tableName, 100);
      setTableData(res);
    } catch (err) {
      console.error("[DatabaseSchemaViewer] Failed to load table data:", err);
    } finally {
      setIsLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchTableData(selectedTable);
  }, [selectedTable, token]);

  const activeDef = SCHEMA_DEFINITIONS.find((d) => d.table === selectedTable) || SCHEMA_DEFINITIONS[0];

  const filteredRows = tableData?.rows
    ? tableData.rows.filter((row) => {
        if (!tableSearch) return true;
        const q = tableSearch.toLowerCase();
        return Object.values(row).some((val) =>
          String(val).toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & View Mode Switcher */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">Database Schema & Table Architecture</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-extrabold uppercase">
                  SQLite 3 WAL MODE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inspect relational ERD connections, foreign keys, and browse live database rows.
              </p>
            </div>
          </div>

          <div className="flex items-center p-1 rounded-2xl bg-slate-950 border border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("erd")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "erd"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Relational ERD Map
            </button>
            <button
              type="button"
              onClick={() => setViewMode("browser")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "browser"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Live Table Browser
            </button>
          </div>
        </div>

        {/* Database Engine Specs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Engine & ORM</span>
            <span className="text-white font-black text-xs mt-0.5 block">
              SQLAlchemy 2.0 Async
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">aiosqlite driver</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Database File</span>
            <span className="text-white font-black text-xs mt-0.5 block">
              {dbInfo?.database_size_kb ?? 0} KB
            </span>
            <span className="text-[10px] text-indigo-400 mt-0.5 block">data/rooms.db</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Write-Ahead Log</span>
            <span className="text-emerald-400 font-black text-xs mt-0.5 block">
              WAL Active ({dbInfo?.wal_size_kb ?? 0} KB)
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Lock-free concurrency</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Tables</span>
            <span className="text-purple-300 font-black text-xs mt-0.5 block">
              6 Relational Tables
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Fully normalized</span>
          </div>
        </div>
      </div>

      {/* 2. RELATIONAL ERD MAP VIEW */}
      {viewMode === "erd" && (
        <div className="space-y-6">
          {/* Relational Flow Summary Diagram */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-indigo-400" />
                <h4 className="font-black text-sm text-white uppercase tracking-wider">
                  Entity Relationship Flow (Foreign Keys & Cascades)
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-mono">1-to-Many & 1-to-1 Architecture</span>
            </div>

            {/* Visual ERD Flow Connectors */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex flex-wrap items-center gap-2 text-slate-300">
                <span className="px-2.5 py-1 rounded-xl bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-bold">
                  users
                </span>
                <span className="text-indigo-400 font-bold">──(1 : N)──►</span>
                <span className="px-2.5 py-1 rounded-xl bg-sky-950 border border-sky-500/40 text-sky-300 font-bold">
                  projects
                </span>
                <span className="text-slate-500 text-[11px] font-sans">
                  (users.id = projects.user_id)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-slate-300">
                <span className="px-2.5 py-1 rounded-xl bg-sky-950 border border-sky-500/40 text-sky-300 font-bold">
                  projects
                </span>
                <span className="text-sky-400 font-bold">──(1 : N)──►</span>
                <span className="px-2.5 py-1 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                  room_sessions
                </span>
                <span className="text-slate-500 text-[11px] font-sans">
                  (projects.id = room_sessions.project_id)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-slate-300">
                <span className="px-2.5 py-1 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                  room_sessions
                </span>
                <span className="text-cyan-400 font-bold">──(1 : N)──►</span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold">
                  surface_regions
                </span>
                <span className="text-slate-500 text-[11px] font-sans">
                  (room_sessions.id = surface_regions.room_session_id) [CASCADE DELETE]
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-slate-300">
                <span className="px-2.5 py-1 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                  room_sessions
                </span>
                <span className="text-purple-400 font-bold">──(1 : 1)──►</span>
                <span className="px-2.5 py-1 rounded-xl bg-purple-950 border border-purple-500/40 text-purple-300 font-bold">
                  gpu_tensor_artifacts
                </span>
                <span className="text-slate-500 text-[11px] font-sans">
                  (room_sessions.id = gpu_tensor_artifacts.room_session_id) [CASCADE DELETE]
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-slate-300">
                <span className="px-2.5 py-1 rounded-xl bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-bold">
                  users
                </span>
                <span className="text-rose-400 font-bold">──(1 : N)──►</span>
                <span className="px-2.5 py-1 rounded-xl bg-rose-950 border border-rose-500/40 text-rose-300 font-bold">
                  user_login_audits
                </span>
                <span className="text-slate-500 text-[11px] font-sans">
                  (users.id = user_login_audits.user_id) [SECURITY AUDIT]
                </span>
              </div>
            </div>
          </div>

          {/* Grid of All 6 Entity Schema Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SCHEMA_DEFINITIONS.map((def) => {
              const IconComp = def.icon;
              const rowCount = dbInfo?.tables?.[def.table]?.rows ?? 0;

              return (
                <div
                  key={def.table}
                  className={`rounded-3xl bg-slate-900/90 border ${def.border} shadow-xl p-5 flex flex-col justify-between gap-4 hover:border-slate-600 transition-all`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${def.color} text-white shadow-md`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-white font-mono">{def.table}</h4>
                          <span className="text-[10px] text-slate-400 block font-sans">{def.title}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-700 font-mono text-xs text-indigo-300 font-black">
                        {rowCount} rows
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      {def.description}
                    </p>

                    {/* Columns List */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
                        Schema Columns ({def.columns.length}):
                      </span>
                      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                        {def.columns.map((col) => (
                          <div
                            key={col.name}
                            className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between font-mono text-[11px]"
                          >
                            <div className="flex items-center gap-1.5">
                              {col.isPk ? (
                                <Key className="w-3 h-3 text-amber-400 shrink-0" />
                              ) : col.isFk ? (
                                <LinkIcon className="w-3 h-3 text-sky-400 shrink-0" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                              )}
                              <span className="text-white font-bold">{col.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{col.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Relationships */}
                  {def.relations.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
                        Connections:
                      </span>
                      {def.relations.map((rel) => (
                        <div key={rel.to} className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="text-indigo-300 font-bold">{rel.to}</span>
                          <span className="text-slate-500 font-sans">({rel.type})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTable(def.table);
                      setViewMode("browser");
                    }}
                    className="w-full py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Table className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Browse {def.table} Data</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. LIVE TABLE DATA BROWSER VIEW */}
      {viewMode === "browser" && (
        <div className="space-y-4">
          {/* Table Switcher Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto max-w-full">
              {SCHEMA_DEFINITIONS.map((def) => (
                <button
                  key={def.table}
                  type="button"
                  onClick={() => setSelectedTable(def.table)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                    selectedTable === def.table
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{def.table}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
                    {dbInfo?.tables?.[def.table]?.rows ?? 0}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={`Search ${selectedTable}...`}
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={() => fetchTableData(selectedTable)}
                disabled={isLoadingTable}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm disabled:opacity-50"
                title="Refresh Table Rows"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTable ? "animate-spin text-indigo-400" : ""}`} />
              </button>
            </div>
          </div>

          {/* Table Data Grid */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                <h4 className="font-mono font-bold text-sm text-white">
                  Table: {selectedTable}
                </h4>
                <span className="text-xs text-slate-400 font-sans">
                  ({filteredRows.length} displayed rows)
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {activeDef.description}
              </span>
            </div>

            <div className="overflow-x-auto max-h-[550px]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 sticky top-0 z-10 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 font-mono">
                  <tr>
                    {tableData?.columns?.map((col) => (
                      <th key={col} className="px-4 py-3 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={tableData?.columns?.length || 6}
                        className="text-center py-16 text-slate-500 font-sans"
                      >
                        {isLoadingTable ? "Loading table data..." : `No records found in table '${selectedTable}'.`}
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-slate-850/60 transition-colors">
                        {tableData?.columns?.map((col) => {
                          const val = row[col];
                          const isId = col === "id" || col.endsWith("_id");
                          const isStatus = col === "status" || col === "is_active" || col === "role";

                          return (
                            <td key={col} className="px-4 py-2.5 whitespace-nowrap max-w-xs truncate">
                              {val === null || val === undefined ? (
                                <span className="text-slate-600 italic">NULL</span>
                              ) : isStatus ? (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-950 border border-slate-700 text-[10px] font-bold text-emerald-400">
                                  {String(val)}
                                </span>
                              ) : isId ? (
                                <span className="text-indigo-300 font-bold" title={String(val)}>
                                  {String(val).slice(0, 8)}...
                                </span>
                              ) : (
                                <span className="text-slate-200" title={String(val)}>
                                  {String(val)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

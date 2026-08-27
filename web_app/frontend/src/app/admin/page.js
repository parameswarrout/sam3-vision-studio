"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Users,
  Layers,
  Database,
  Cpu,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowLeft,
  Laptop,
  Globe,
  Lock,
  Activity,
  Server,
  UserCheck,
  TrendingUp,
  UserPlus,
  Edit2,
  Trash2,
  KeyRound,
  HardDrive,
  FileCode,
  FileSpreadsheet,
  Check,
  FolderArchive,
} from "lucide-react";
import { Header } from "@/components/common/Header";
import { UserManageModal } from "@/components/admin/UserManageModal";
import { DatabaseSchemaViewer } from "@/components/admin/DatabaseSchemaViewer";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api";

export default function AdminDashboardPage() {
  const { health, isOnline } = useBackendHealth();
  const { user, token } = useAuth();

  const [stats, setStats] = useState(null);
  const [dbInfo, setDbInfo] = useState(null);
  const [logins, setLogins] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [activeTab, setActiveTab] = useState("users"); // 'users' | 'logins' | 'database'
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  // User CRUD Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const [statsRes, dbInfoRes, loginsRes, usersRes] = await Promise.all([
        apiClient.getAdminStats(token).catch(() => null),
        apiClient.getDatabaseInfo(token).catch(() => null),
        apiClient.getLoginAudits(token, 100, 0).catch(() => []),
        apiClient.getAdminUsers(token).catch(() => []),
      ]);

      if (statsRes) setStats(statsRes);
      if (dbInfoRes) setDbInfo(dbInfoRes);
      if (Array.isArray(loginsRes)) setLogins(loginsRes);
      if (Array.isArray(usersRes)) setUsersList(usersRes);
    } catch (err) {
      console.error("[AdminDashboard] Error fetching telemetry:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 12000); // 12s live telemetry polling
    return () => clearInterval(interval);
  }, [token]);

  const handleSaveUser = async (payload, userId = null) => {
    if (userId) {
      // Update
      const updated = await apiClient.updateUserAdmin(token, userId, payload);
      setUsersList((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } else {
      // Create
      const created = await apiClient.createUserAdmin(token, payload);
      setUsersList((prev) => [...prev, created]);
    }
    fetchData();
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.email === "pa") {
      alert("Cannot delete Primary Administrator 'pa'.");
      return;
    }
    if (!confirm(`Are you sure you want to delete user '${targetUser.full_name}' (${targetUser.email})?`)) {
      return;
    }

    try {
      await apiClient.deleteUserAdmin(token, targetUser.id);
      setUsersList((prev) => prev.filter((u) => u.id !== targetUser.id));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await apiClient.updateUserRole(token, userId, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      alert(`Failed to update role: ${err.message}`);
    }
  };

  const filteredLogins = logins.filter((item) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      item.username_or_email?.toLowerCase().includes(q) ||
      item.ip_address?.toLowerCase().includes(q) ||
      item.role?.toLowerCase().includes(q) ||
      item.status?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Header
        health={health}
        isOnline={isOnline}
        activeNav="admin"
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Page Title & Back Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/room-analysis"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
              title="Return to Room Analysis"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Admin Command & Security Center
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-mono text-[10px] font-extrabold uppercase">
                  PA ADMIN ACCESS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time user login audit trail, database telemetry, and team account management.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {activeTab === "users" && (
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setIsUserModalOpen(true);
                }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add New User</span>
              </button>
            )}

            <button
              type="button"
              onClick={fetchData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 1. Telemetry Overview Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Users */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {usersList.length || stats?.total_users || 1}
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">Studio Accounts</span>
            </div>
          </div>

          {/* Stored Room Analyses */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-sky-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analyzed Rooms</span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {stats?.total_room_sessions ?? 0}
              </span>
              <span className="text-[11px] font-mono text-sky-400 font-bold">Stored Sessions</span>
            </div>
          </div>

          {/* GPU Tensor Storage Size */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Database & Tensors</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {dbInfo?.storage_tier_2?.total_storage_mb ?? stats?.total_tensor_storage_mb ?? "0.0"}
                <span className="text-sm font-normal text-slate-400 ml-1">MB</span>
              </span>
              <span className="text-[11px] font-mono text-purple-400 font-bold">WAL + NPZ</span>
            </div>
          </div>

          {/* Hardware Device */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Neural Engine</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 uppercase font-mono">
                {health?.device || "CUDA"}
              </span>
              <span className="text-[11px] font-mono text-slate-400 font-bold">24GB VRAM</span>
            </div>
          </div>
        </div>

        {/* 2. Navigation Tabs (Team Users, Login Audits & Database Telemetry) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 self-start overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === "users"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Studio Accounts</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono font-bold">
                {usersList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("logins")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === "logins"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Login Audits</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono font-bold">
                {logins.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("database")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === "database"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 text-purple-300" />
              <span>Database Telemetry</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 border border-purple-500/40 text-purple-300 font-mono font-bold">
                SQLITE WAL
              </span>
            </button>
          </div>

          {activeTab === "logins" && (
            <input
              type="text"
              placeholder="Search by user, IP address or status..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-72"
            />
          )}
        </div>

        {/* 3. Studio Team Accounts Panel (Full CRUD) */}
        {activeTab === "users" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Account / Member</th>
                    <th className="px-4 py-3">Username / Email</th>
                    <th className="px-4 py-3">Role & Permissions</th>
                    <th className="px-4 py-3">Account Status</th>
                    <th className="px-4 py-3">Last Active / Login</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {usersList.map((u) => {
                    const isPrimaryAdmin = u.email === "pa";
                    const lastLoginStr = u.last_login_at
                      ? new Date(u.last_login_at).toLocaleString()
                      : "Never / Default";

                    return (
                      <tr key={u.id} className="hover:bg-slate-850/60 transition-colors">
                        {/* Name & Avatar */}
                        <td className="px-4 py-3 font-bold text-white">
                          <div className="flex items-center gap-3">
                            {u.avatar_url || isPrimaryAdmin ? (
                              <img
                                src={u.avatar_url || "/avatar_pa_thumb.jpg"}
                                alt={u.full_name}
                                className="w-9 h-9 rounded-full object-cover border-2 border-indigo-400/90 shadow-md shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-indigo-400 shrink-0">
                                {u.full_name[0]?.toUpperCase() || "U"}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-black text-sm text-white truncate">{u.full_name}</p>
                              {isPrimaryAdmin ? (
                                <span className="inline-block text-[9px] font-mono text-emerald-400 font-bold uppercase bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded mt-0.5">
                                  Primary Admin
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-400 capitalize">
                                  {u.role}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3 font-mono text-slate-300">
                          {u.email || "Local Development"}
                        </td>

                        {/* Role Select */}
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={isPrimaryAdmin}
                            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                          >
                            <option value="admin">ADMIN (Full Control)</option>
                            <option value="architect">ARCHITECT (Analyze & Edit)</option>
                            <option value="client">CLIENT (View-Only)</option>
                          </select>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                              u.is_active
                                ? "bg-emerald-950/60 border border-emerald-500/30 text-emerald-400"
                                : "bg-rose-950/60 border border-rose-500/30 text-rose-400"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.is_active ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                              }`}
                            />
                            <span>{u.is_active ? "ACTIVE" : "SUSPENDED"}</span>
                          </span>
                        </td>

                        {/* Last Login */}
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                          {lastLoginStr}
                        </td>

                        {/* Action Buttons (Edit / Delete) */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUser(u);
                                setIsUserModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-indigo-300 hover:text-white transition-all shadow-sm"
                              title="Edit user details or reset password"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {!isPrimaryAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-all shadow-sm"
                                title="Delete user account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Live Login Audit Trail Panel */}
        {activeTab === "logins" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Account / User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3">Client Device / Browser</th>
                    <th className="px-4 py-3 text-right">Login Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredLogins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-500">
                        No login audit records found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogins.map((item) => {
                      const isSuccess = item.status === "SUCCESS" || item.status === "REGISTER";
                      const dateFormatted = new Date(item.created_at).toLocaleString();

                      return (
                        <tr key={item.id} className="hover:bg-slate-850/60 transition-colors">
                          {/* Status Pill */}
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                                item.status === "SUCCESS"
                                  ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-300"
                                  : item.status === "REGISTER"
                                  ? "bg-sky-950/80 border border-sky-500/40 text-sky-300"
                                  : "bg-rose-950/80 border border-rose-500/40 text-rose-300"
                              }`}
                            >
                              {isSuccess ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              <span>{item.status}</span>
                            </span>
                          </td>

                          {/* Username / Email */}
                          <td className="px-4 py-3 font-sans font-bold text-white">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-[10px] text-indigo-300 font-black">
                                {item.username_or_email[0]?.toUpperCase() || "U"}
                              </div>
                              <span>{item.username_or_email}</span>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-4 py-3">
                            <span className="text-[11px] uppercase font-bold text-slate-300">
                              {item.role}
                            </span>
                          </td>

                          {/* IP Address */}
                          <td className="px-4 py-3 text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Globe className="w-3 h-3 text-slate-500" />
                              {item.ip_address}
                            </span>
                          </td>

                          {/* Device / Browser */}
                          <td className="px-4 py-3 text-slate-400 truncate max-w-xs font-sans text-[11px]">
                            <span className="flex items-center gap-1.5 truncate">
                              <Laptop className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{item.user_agent || "Unknown Browser"}</span>
                            </span>
                          </td>

                          {/* Login Time */}
                          <td className="px-4 py-3 text-right text-slate-300">
                            <span className="flex items-center justify-end gap-1.5 text-[11px]">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {dateFormatted}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Deep Database Telemetry, Interactive Schema ERD & Table Browser */}
        {activeTab === "database" && (
          <DatabaseSchemaViewer token={token} dbInfo={dbInfo} />
        )}
      </main>

      {/* User Management & Password Reset Modal */}
      <UserManageModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        editingUser={editingUser}
      />
    </div>
  );
}

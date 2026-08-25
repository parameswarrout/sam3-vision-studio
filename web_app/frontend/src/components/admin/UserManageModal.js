"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, User, Mail, Lock, Shield, CheckCircle2, Loader2, Sparkles, KeyRound } from "lucide-react";

export function UserManageModal({ isOpen, onClose, onSave, editingUser = null }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("architect");
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editingUser) {
      setFullName(editingUser.full_name || "");
      setEmail(editingUser.email || "");
      setRole(editingUser.role || "architect");
      setIsActive(editingUser.is_active ?? true);
      setPassword(""); // Blank unless admin wants to reset
    } else {
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("architect");
      setIsActive(true);
    }
    setError(null);
  }, [editingUser, isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (editingUser) {
        // Update user payload
        const payload = {
          full_name: fullName,
          email: email,
          role: role,
          is_active: isActive,
        };
        if (password.trim()) {
          payload.password = password.trim();
        }
        await onSave(payload, editingUser.id);
      } else {
        // Create user payload
        if (!password.trim()) {
          throw new Error("Password is required for new accounts.");
        }
        await onSave({
          full_name: fullName,
          email: email,
          password: password.trim(),
          role: role,
          is_active: isActive,
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save user.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/90 shadow-2xl shadow-black p-6 sm:p-7 z-10 flex flex-col gap-4 m-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">
              {editingUser ? `Edit Account: ${editingUser.full_name}` : "Add New Studio Account"}
            </h3>
            <p className="text-xs text-slate-400">Manage credentials, roles and system permissions</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Username or Email */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Username or Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="e.g. sjenkins or sarah@studio.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Assigned Role</label>
            <div className="relative">
              <Shield className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={editingUser?.email === "pa"}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              >
                <option value="architect">Lead Architect (Analyze & Edit Rooms)</option>
                <option value="admin">Administrator (Full System & User Control)</option>
                <option value="client">Client / Reviewer (View-Only Access)</option>
              </select>
            </div>
          </div>

          {/* Password (Required on create, optional on edit) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-300">
                {editingUser ? "Reset Password (Optional)" : "Account Password"}
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono font-bold flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" />
                <span>Auto-Generate</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={editingUser ? "Leave blank to keep existing password" : "Enter temporary or secure password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Active Status Switch */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Account Status</span>
              <span className="text-[10px] text-slate-400">Enable or disable login access</span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive((prev) => !prev)}
              disabled={editingUser?.email === "pa"}
              className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition-all ${
                isActive
                  ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                  : "bg-rose-600/30 text-rose-300 border border-rose-500/40"
              }`}
            >
              {isActive ? "ACTIVE" : "SUSPENDED"}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 active:scale-98"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{editingUser ? "Save Account Changes" : "Create Studio Account"}</span>
          </button>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

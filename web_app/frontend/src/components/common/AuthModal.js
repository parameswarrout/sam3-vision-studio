"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Lock, Mail, User, Shield, CheckCircle2, Loader2, Sparkles } from "lucide-react";

export function AuthModal({ isOpen, onClose, onLogin, onRegister }) {
  const [tab, setTab] = useState("login"); // 'login' | 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("architect");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (tab === "login") {
        await onLogin(email, password);
      } else {
        await onRegister(email, password, fullName || "Studio Member", role);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Dead-Center Modal Box */}
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-black p-6 sm:p-7 z-10 flex flex-col gap-4 m-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Studio Authentication</h3>
            <p className="text-xs text-slate-400">Meta SAM 3 Multi-User & Project Access</p>
          </div>
        </div>

        {/* Tabs: Login vs Register */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === "login"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === "register"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === "register" && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Parameswar Rout"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Studio Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="architect">Lead Architect / Designer</option>
                  <option value="admin">Studio Administrator</option>
                  <option value="client">Client / Reviewer (View-Only)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Username or Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="e.g. pa or architect@studio.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
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
            <span>{tab === "login" ? "Sign In to Studio" : "Create Account & Token"}</span>
          </button>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

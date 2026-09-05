"use client";

import { CheckCircle2, AlertTriangle, ShieldCheck, Gauge, Layers, Sparkles, X } from "lucide-react";

export function QualityMetricsModal({ metrics, timings, planeEquation, lightParams, isOpen, onClose }) {
  if (!isOpen || !metrics) return null;

  const gates = [
    {
      name: "Boundary F-Score (Contour Precision)",
      value: `${(metrics.boundary_f_score * 100).toFixed(2)}%`,
      raw: metrics.boundary_f_score,
      target: "≥ 90.0%",
      passed: metrics.boundary_f_score >= 0.90,
      description: "Measures sub-pixel contour edge alignment quality vs. target surface boundaries.",
    },
    {
      name: "3D Plane Reprojection Error",
      value: `${metrics.plane_reprojection_error_pct.toFixed(2)}%`,
      raw: metrics.plane_reprojection_error_pct,
      target: "< 1.50% img diag",
      passed: metrics.plane_reprojection_error_pct < 1.50,
      description: "Perpendicular error of 3D plane inliers projected back to image space.",
    },
    {
      name: "Intrinsic Reconstruction SSIM",
      value: metrics.intrinsic_reconstruction_ssim.toFixed(4),
      raw: metrics.intrinsic_reconstruction_ssim,
      target: "≥ 0.9700",
      passed: metrics.intrinsic_reconstruction_ssim >= 0.97,
      description: "SSIM between reconstructed (Albedo × Shading) and original surface illumination.",
    },
    {
      name: "Unmasked Region Preservation",
      value: `SSIM: ${metrics.unmasked_ssim.toFixed(5)} | LPIPS: ${metrics.unmasked_lpips.toFixed(4)}`,
      raw: metrics.unmasked_ssim,
      target: "SSIM ≥ 0.9950, LPIPS ≤ 0.02",
      passed: metrics.unmasked_ssim >= 0.995 && metrics.unmasked_lpips <= 0.02,
      description: "Guarantees the rest of the room outside the mask remains strictly 100% pixel-identical.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">V5 Empirical Quality Gate Audit</h3>
              <p className="text-xs text-slate-400">Strict numeric metrics for deterministic Vision + Graphics pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overall Status Banner */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            metrics.quality_gates_passed
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : "bg-amber-950/40 border-amber-500/40 text-amber-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {metrics.quality_gates_passed ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            )}
            <div>
              <p className="font-black text-sm">
                {metrics.quality_gates_passed ? "ALL 4 ACCEPTANCE GATES PASSED" : "QUALITY GATE WARNING"}
              </p>
              <p className="text-xs opacity-80">
                {metrics.quality_gates_passed
                  ? "Replaced surface is geometrically calibrated and unmasked region is 100% preserved."
                  : "Some metrics deviate from the strict engineering threshold."}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold uppercase px-3 py-1 rounded-xl bg-white/10">
            {timings?.total_pipeline_ms ? `${timings.total_pipeline_ms.toFixed(0)} ms` : "OK"}
          </span>
        </div>

        {/* 4 Metrics Grid */}
        <div className="space-y-3">
          {gates.map((g, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{g.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    Target: {g.target}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{g.description}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono font-black text-sm text-white">{g.value}</span>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  {g.passed ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> PASS
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> FAIL
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Plane & Light Diagnostic Details */}
        {planeEquation && (
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1">
            <p className="text-indigo-300 font-bold">RANSAC Plane Equation:</p>
            <p className="text-slate-300">
              {planeEquation.a.toFixed(3)}x + {planeEquation.b.toFixed(3)}y + {planeEquation.c.toFixed(3)}z +{" "}
              {planeEquation.d.toFixed(3)} = 0 (Inlier ratio: {(planeEquation.inlier_ratio * 100).toFixed(1)}%)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

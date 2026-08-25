export function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-slate-800/80 text-slate-300 border-slate-700/50",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    brand: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-sm ${
        variants[variant] || variants.default
      } ${className}`}
    >
      {children}
    </span>
  );
}

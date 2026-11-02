export function HealthBar({ current, max, label = "HP", className = "" }) {
  const pct = Math.max(0, Math.min(100, (current / Math.max(1, max)) * 100));
  const color = pct > 50 ? "bg-emerald" : pct > 25 ? "bg-gold" : "bg-blood";
  return (
    <div className={className}>
      <div className="flex justify-between font-pixel text-[9px] uppercase tracking-wider text-parchment/80 mb-1">
        <span>{label}</span>
        <span>{Math.max(0, current)} / {max}</span>
      </div>
      <div className="h-3 bg-ink-950 border border-ink-600 relative overflow-hidden">
        <div className={`h-full ${color} transition-[width] duration-300`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function XpBar({ current, needed, className = "" }) {
  const pct = Math.max(0, Math.min(100, (current / Math.max(1, needed)) * 100));
  return (
    <div className={className}>
      <div className="flex justify-between font-pixel text-[9px] uppercase tracking-wider text-parchment/80 mb-1">
        <span>XP</span>
        <span>{current} / {needed}</span>
      </div>
      <div className="h-3 bg-ink-950 border border-ink-600 relative overflow-hidden">
        <div className="h-full bg-mana-bright transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
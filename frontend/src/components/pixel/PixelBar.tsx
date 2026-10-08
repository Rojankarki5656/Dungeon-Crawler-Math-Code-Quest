interface Props {
  value: number;
  max: number;
  color?: string;
  bg?: string;
  height?: number;
  label?: string;
  showNumbers?: boolean;
  className?: string;
}

export function PixelBar({
  value, max, color, bg = '#3a1414', height = 14, label, showNumbers = true, className = '',
}: Props) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const auto = pct > 0.5 ? '#4caf50' : pct > 0.22 ? '#ffd166' : '#e04141';
  const fill = color ?? auto;

  return (
    <div className={className}>
      {(label || showNumbers) && (
        <div className="mb-1 flex items-center justify-between text-[8px] tracking-widest"
             style={{ fontFamily: '"Press Start 2P", monospace', color: '#8fa3c8' }}>
          <span>{label}</span>
          {showNumbers && <span style={{ color: fill }}>{Math.max(0, Math.round(value))}/{max}</span>}
        </div>
      )}
      <div className="px-bar" style={{ height }}>
        <div className="px-bar__fill" style={{ width: `${pct * 100}%`, background: fill }} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 42%, transparent 58%, rgba(0,0,0,0.32) 100%)`,
          }}
        />
        {/* Segment ticks for that arcade look */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 6px, rgba(0,0,0,0.55) 6px 8px)' }}
        />
      </div>
    </div>
  );
}
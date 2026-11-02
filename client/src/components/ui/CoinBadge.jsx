export function CoinBadge({ coins }) {
  return (
    <div className="inline-flex items-center gap-2 bg-ink-800 border-2 border-ink-600 px-3 py-1.5">
      <span className="font-pixel text-xs text-gold-bright">◈</span>
      <span className="font-mono text-sm text-parchment">{coins}</span>
    </div>
  );
}
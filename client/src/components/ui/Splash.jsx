export function Splash({ message = "Loading…" }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <div className="font-pixel text-gold-bright text-2xl">⚔</div>
      <div className="font-pixel text-xs uppercase tracking-widest text-parchment/70">
        {message}
      </div>
    </div>
  );
}
export function PixelInput({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="block mb-2 font-pixel text-[10px] uppercase tracking-widest text-gold-bright">
          {label}
        </span>
      )}
      <input
        {...props}
        className={[
          "w-full bg-ink-950 border-2 border-ink-600 focus:border-gold",
          "px-3 py-2 font-mono text-parchment outline-none transition-colors",
          "placeholder:text-ink-600",
          className,
        ].join(" ")}
      />
    </label>
  );
}
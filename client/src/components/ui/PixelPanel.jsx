export function PixelPanel({ title, className = "", children, ...rest }) {
  return (
    <div
      {...rest}
      className={[
        "relative bg-ink-900 border-2 border-ink-600 shadow-pixel scanlines",
        className,
      ].join(" ")}
    >
      {title && (
        <div className="border-b-2 border-ink-600 px-4 py-3">
          <h2 className="font-pixel text-xs uppercase tracking-widest text-gold-bright">
            {title}
          </h2>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
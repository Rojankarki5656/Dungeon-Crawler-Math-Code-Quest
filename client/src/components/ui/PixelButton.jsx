const variants = {
  primary: "bg-gold text-ink-950 border-gold-bright hover:bg-gold-bright",
  secondary: "bg-ink-800 text-parchment border-ink-600 hover:bg-ink-700",
  danger: "bg-blood text-parchment border-blood-bright hover:bg-blood-bright",
  ghost: "bg-transparent text-parchment border-ink-600 hover:bg-ink-800",
};
const sizes = {
  sm: "px-3 py-2 text-[10px]",
  md: "px-5 py-3 text-xs",
  lg: "px-7 py-4 text-sm",
};

export function PixelButton({
  children, variant = "primary", size = "md", className = "", disabled, ...rest
}) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={[
        "font-pixel uppercase tracking-wider border-2 shadow-pixel",
        "transition-[transform,box-shadow] duration-100",
        "hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-pixel-sm",
        "active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0",
        variants[variant], sizes[size], className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
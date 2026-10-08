import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  variant?: 'default' | 'inset';
  accent?: string;
  children: ReactNode;
}

export const PixelPanel = forwardRef<HTMLDivElement, Props>(function PixelPanel(
  { title, variant = 'default', accent = '#ffd166', className = '', children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`${variant === 'inset' ? 'px-panel-inset' : 'px-panel'} relative ${className}`}
      {...rest}
    >
      {title && (
        <div
          className="absolute -top-[11px] left-3 px-2 py-[2px] text-[8px] tracking-widest"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            background: '#141b2d',
            color: accent,
            border: '2px solid #3d4d75',
            boxShadow: '2px 2px 0 0 rgba(0,0,0,0.7)',
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
});
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'good' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  children: ReactNode;
}

const SIZES = {
  sm: 'px-3 py-2 text-[8px]',
  md: 'px-4 py-3 text-[10px]',
  lg: 'px-6 py-4 text-[12px]',
} as const;

const VARIANTS = {
  primary: 'px-btn',
  danger: 'px-btn px-btn-danger',
  good: 'px-btn px-btn-good',
  ghost: 'px-btn px-btn-ghost',
} as const;

export function PixelButton({
  variant = 'primary', size = 'md', full, className = '', children, ...rest
}: Props) {
  return (
    <button
      className={`${VARIANTS[variant]} ${SIZES[size]} ${full ? 'w-full' : ''} uppercase tracking-wider ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
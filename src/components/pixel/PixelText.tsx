import type { HTMLAttributes, ReactNode } from 'react';

interface Props extends HTMLAttributes<HTMLSpanElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  shadow?: boolean;
  children: ReactNode;
}

const SIZE: Record<string, string> = {
  xs: 'text-[7px]', sm: 'text-[9px]', md: 'text-[11px]', lg: 'text-[14px]', xl: 'text-[20px]',
};

export function PixelText({
  size = 'sm', color = '#e8f1ff', shadow = true, className = '', children, ...rest
}: Props) {
  return (
    <span
      className={`${SIZE[size]} ${shadow ? 'px-text-shadow' : ''} tracking-wider ${className}`}
      style={{ fontFamily: '"Press Start 2P", monospace', color, lineHeight: 1.6 }}
      {...rest}
    >
      {children}
    </span>
  );
}
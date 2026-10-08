import { useState } from 'react';
import { PixelText } from './PixelText';

interface Props {
  value: string;
  color?: string;
}

export function CopyChip({ value, color = '#ffd166' }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = document.createElement('textarea');
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      title="Click to copy"
      className="flex items-center gap-2 px-2 py-[3px] transition-colors"
      style={{
        background: copied ? 'rgba(76,175,80,0.15)' : 'rgba(255,209,102,0.08)',
        border: `2px solid ${copied ? '#4caf50' : 'rgba(255,209,102,0.35)'}`,
        cursor: 'pointer',
      }}
    >
      <PixelText size="sm" color={copied ? '#4caf50' : color}>{value}</PixelText>
      <PixelText size="xs" color={copied ? '#4caf50' : '#8fa3c8'}>
        {copied ? 'COPIED' : 'COPY'}
      </PixelText>
    </button>
  );
}
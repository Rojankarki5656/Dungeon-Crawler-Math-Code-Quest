import { useGameStore } from '@/state/store';
import { PixelText } from './pixel/PixelText';

const MAP = {
  connecting:   { label: 'CONNECTING', color: '#ffd166', dot: '#ffd166' },
  online:       { label: 'ONLINE',     color: '#4caf50', dot: '#4caf50' },
  reconnecting: { label: 'RECONNECT',  color: '#f4a261', dot: '#f4a261' },
  offline:      { label: 'OFFLINE',    color: '#e04141', dot: '#e04141' },
} as const;

export function ConnectionBadge() {
  const status = useGameStore((s) => s.connection);
  const cfg = MAP[status];

  return (
    <div
      className="flex items-center gap-2 px-2 py-[6px]"
      style={{
        background: '#141b2d',
        border: '2px solid #3d4d75',
        boxShadow: '2px 2px 0 0 rgba(0,0,0,0.7)',
      }}
    >
      <span
        className={status === 'online' ? '' : 'px-blink'}
        style={{
          width: 8, height: 8, background: cfg.dot,
          boxShadow: `0 0 6px ${cfg.dot}`, display: 'inline-block',
        }}
      />
      <PixelText size="xs" color={cfg.color}>{cfg.label}</PixelText>
    </div>
  );
}
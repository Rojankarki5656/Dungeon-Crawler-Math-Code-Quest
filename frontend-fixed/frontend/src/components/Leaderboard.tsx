import { useGameStore } from '@/state/store';
import { PixelPanel } from './pixel/PixelPanel';
import { PixelText } from './pixel/PixelText';

const RANK_COLORS = ['#ffd166', '#c8d8f0', '#d4a05a'];

export function Leaderboard() {
  const board = useGameStore((s) => s.leaderboard);
  const selfId = useGameStore((s) => s.selfId);

  return (
    <PixelPanel title="LEADERBOARD" className="px-3 pb-3 pt-5 w-full">
      <div className="space-y-[3px]">
        {board.length === 0 && (
          <PixelText size="xs" color="#55678a">AWAITING CHALLENGERS...</PixelText>
        )}
        {board.map((e) => {
          const isSelf = e.id === selfId;
          const color = RANK_COLORS[e.rank - 1] ?? '#8fa3c8';
          return (
            <div
              key={e.id}
              className="flex items-center justify-between px-2 py-[5px]"
              style={{
                background: isSelf ? 'rgba(255,209,102,0.10)' : 'rgba(255,255,255,0.02)',
                border: isSelf ? '2px solid rgba(255,209,102,0.45)' : '2px solid transparent',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <PixelText size="xs" color={color} style={{ minWidth: 18 }}>
                  {String(e.rank).padStart(2, '0')}
                </PixelText>
                <PixelText
                  size="xs"
                  color={isSelf ? '#ffd166' : '#e8f1ff'}
                  className="truncate max-w-[110px]"
                >
                  {e.name}
                </PixelText>
              </div>
              <PixelText size="xs" color="#7fb2ff">{e.score}</PixelText>
            </div>
          );
        })}
      </div>
    </PixelPanel>
  );
}
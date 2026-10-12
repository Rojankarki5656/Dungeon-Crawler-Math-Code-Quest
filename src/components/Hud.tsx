import { useGameStore, selectSelf } from '@/state/store';
import { PixelPanel } from './pixel/PixelPanel';
import { PixelBar } from './pixel/PixelBar';
import { PixelText } from './pixel/PixelText';
import { TILE, TILE_NAMES } from '@/game/tile-constants';

export function Hud() {
  const self = useGameStore(selectSelf);
  const lobby = useGameStore((s) => s.lobby);
  const monsters = useGameStore((s) => s.monsters);
  const players = useGameStore((s) => s.players);

  if (!self || !lobby?.map) return null;

  const tileId = lobby.map.tiles[self.y * lobby.map.width + self.x];
  const aliveMonsters = monsters.filter((m) => m.hp > 0).length;
  const onlineCount = Object.values(players).filter((p) => p.connected).length;
  const cleared = monsters.length > 0
    ? Math.round(((monsters.length - aliveMonsters) / monsters.length) * 100)
    : 0;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-4">
      {/* ---------- TOP BAR ---------- */}
      <div className="flex items-start justify-between gap-3">
        <PixelPanel title="STATUS" className="px-3 pb-3 pt-4 min-w-[190px]">
          <div className="space-y-2">
            <PixelBar value={self.hp} max={self.maxHp} label="HP" height={13} />
            <div className="flex items-center justify-between pt-1">
              <PixelText size="xs" color="#8fa3c8">SCORE</PixelText>
              <PixelText size="sm" color="#ffd166">{self.score}</PixelText>
            </div>
          </div>
        </PixelPanel>

        <PixelPanel title="DUNGEON" className="px-3 pb-3 pt-4 hidden sm:block">
          <div className="flex gap-5 text-center">
            <Stat label="SLAYED" value={`${cleared}%`} color="#4caf50" />
            <Stat label="ALIVE" value={String(aliveMonsters)} color="#e04141" />
            <Stat label="HEROES" value={String(onlineCount)} color="#7fb2ff" />
          </div>
        </PixelPanel>
      </div>

      {/* ---------- BOTTOM BAR ---------- */}
      <div className="flex items-end justify-between gap-3">
        <PixelPanel title="POSITION" className="px-3 pb-3 pt-4">
          <div className="flex items-center gap-4">
            <PixelText size="sm" color="#7fb2ff">X:{String(self.x).padStart(2, '0')}</PixelText>
            <PixelText size="sm" color="#7fb2ff">Y:{String(self.y).padStart(2, '0')}</PixelText>
            <PixelText size="xs" color="#55678a">{TILE_NAMES[tileId] ?? 'UNKNOWN'}</PixelText>
          </div>
        </PixelPanel>

        <PixelPanel className="px-3 pb-3 pt-4 hidden md:block">
          <PixelText size="xs" color="#55678a">
            WASD / ARROWS · MOVE&nbsp;&nbsp;|&nbsp;&nbsp;ENTER · ANSWER
          </PixelText>
        </PixelPanel>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <PixelText size="xs" color="#55678a" className="block">{label}</PixelText>
      <PixelText size="lg" color={color} className="block mt-1">{value}</PixelText>
    </div>
  );
}
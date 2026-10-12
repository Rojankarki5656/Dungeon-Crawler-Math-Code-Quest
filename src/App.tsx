import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '@/state/store';
import { useAuthStore } from '@/state/authStore';
import { useGameSocket } from '@/hooks/useGameSocket';
import { useKeyboard } from '@/hooks/useKeyboard';
import type { Direction } from '@/game/input';

import { AuthScreen } from '@/components/AuthScreen';
import { LobbyScreen } from '@/components/LobbyScreen';
import { DungeonCanvas } from '@/components/DungeonCanvas';
import { Hud } from '@/components/Hud';
import { Leaderboard } from '@/components/Leaderboard';
import { QuestionModal } from '@/components/QuestionModal';
import { VictoryOverlay } from '@/components/VictoryOverlay';
import { ConnectionBadge } from '@/components/ConnectionBadge';
import { CopyChip } from '@/components/pixel/CopyChip';
import { PixelText } from '@/components/pixel/PixelText';
import { PixelPanel } from '@/components/pixel/PixelPanel';

export default function App() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  const lobby = useGameStore((s) => s.lobby);
  const selfId = useGameStore((s) => s.selfId);
  const directionRef = useRef<Direction>('down');
  const [showGrid, setShowGrid] = useState(false);

  /* ---- Restore auth session on boot ---- */
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-px-bg">
        <PixelText size="sm" color="#ffd166" className="px-blink">
          LOADING...
        </PixelText>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-crt relative h-screen w-screen overflow-hidden bg-px-bg">
        <AuthScreen />
      </div>
    );
  }

  return <AuthedApp />;
}

function AuthedApp() {
  const lobby = useGameStore((s) => s.lobby);
  const selfId = useGameStore((s) => s.selfId);
  const user = useAuthStore((s) => s.user);
  const directionRef = useRef<Direction>('down');
  const [showGrid, setShowGrid] = useState(false);

  const { move, submitAnswer, createLobby, joinLobby } = useGameSocket();

  const onDirection = useCallback((d: Direction) => {
    directionRef.current = d;
    move(d);
  }, [move]);

  const { press } = useKeyboard(onDirection);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'G' || e.key === 'g')) setShowGrid((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const inGame = !!lobby?.map && !!selfId;

  const dpad = useMemo(() => {
    if (!inGame) return null;
    const btn = 'px-btn px-btn-ghost flex items-center justify-center text-[14px] select-none';
    const size = 'w-[52px] h-[52px] md:w-[58px] md:h-[58px]';
    return (
      <div className="pointer-events-auto grid grid-cols-3 grid-rows-3 gap-1 md:hidden">
        <div />
        <button className={`${btn} ${size}`} onPointerDown={(e) => { e.preventDefault(); press('up'); }}>▲</button>
        <div />
        <button className={`${btn} ${size}`} onPointerDown={(e) => { e.preventDefault(); press('left'); }}>◀</button>
        <div />
        <button className={`${btn} ${size}`} onPointerDown={(e) => { e.preventDefault(); press('right'); }}>▶</button>
        <div />
        <button className={`${btn} ${size}`} onPointerDown={(e) => { e.preventDefault(); press('down'); }}>▼</button>
        <div />
      </div>
    );
  }, [inGame, press]);

  return (
    <div className="px-crt relative h-screen w-screen overflow-hidden bg-px-bg">
      {!inGame ? (
        <LobbyScreen
          playerName={user?.playerName ?? 'HERO'}
          onCreate={createLobby}
          onJoin={joinLobby}
        />
      ) : (
        <div className="relative h-full w-full px-scanline">
          <DungeonCanvas directionRef={directionRef} showGrid={showGrid} />
          <Hud />

          <div className="pointer-events-none absolute right-3 top-[92px] hidden w-[248px] flex-col gap-3 lg:flex">
            <Leaderboard />
            <PixelPanel title="LOBBY" className="px-3 pb-3 pt-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <PixelText size="xs" color="#55678a">CODE</PixelText>
                  <CopyChip value={lobby!.id} />
                </div>
                <div className="flex items-center justify-between">
                  <PixelText size="xs" color="#55678a">NAME</PixelText>
                  <PixelText size="xs" color="#e8f1ff" className="truncate max-w-[130px]">
                    {lobby!.name}
                  </PixelText>
                </div>
                <div className="flex items-center justify-between">
                  <PixelText size="xs" color="#55678a">STATUS</PixelText>
                  <PixelText size="xs" color="#4caf50">{lobby!.status.toUpperCase()}</PixelText>
                </div>
              </div>
            </PixelPanel>
          </div>

          <div className="pointer-events-none absolute right-3 top-3">
            <ConnectionBadge />
          </div>

          <div className="pointer-events-none absolute bottom-4 left-4">{dpad}</div>

          <VictoryOverlay />
          <QuestionModal onSubmit={submitAnswer} />
        </div>
      )}
    </div>
  );
}
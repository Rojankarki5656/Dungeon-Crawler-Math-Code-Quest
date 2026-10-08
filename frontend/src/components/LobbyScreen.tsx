import { useState } from 'react';
import { PixelPanel } from './pixel/PixelPanel';
import { PixelButton } from './pixel/PixelButton';
import { PixelText } from './pixel/PixelText';
import { ConnectionBadge } from './ConnectionBadge';

interface Props {
  onCreate: (name: string) => void;
  onJoin: (lobbyId: string) => void;
  playerName: string;
}

export function LobbyScreen({ onCreate, onJoin, playerName }: Props) {
  const [lobbyName, setLobbyName] = useState('DUNGEON OF ALGORITHMS');
  const [joinCode, setJoinCode] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-[540px] space-y-5">
        {/* ---------- TITLE ---------- */}
        <div className="text-center">
          <PixelText size="xl" color="#ffd166" className="block px-float">
            DUNGEON
          </PixelText>
          <PixelText size="lg" color="#4a7fd4" className="mt-3 block">
            MATH / CODE QUEST
          </PixelText>
          <div className="mt-4 flex justify-center">
            <ConnectionBadge />
          </div>
        </div>

        {/* ---------- CARD ---------- */}
        <PixelPanel title="MULTIPLAYER" className="p-5 pt-7">
          {/* Tabs */}
          <div className="mb-5 flex gap-2">
            <PixelButton
              variant={tab === 'create' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTab('create')}
              className="flex-1"
            >
              CREATE
            </PixelButton>
            <PixelButton
              variant={tab === 'join' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTab('join')}
              className="flex-1"
            >
              JOIN
            </PixelButton>
          </div>

          {tab === 'create' ? (
            <div className="space-y-4">
              <Field label="DUNGEON NAME">
                <input
                  className="px-input w-full px-3 py-3 text-[10px] tracking-widest"
                  value={lobbyName}
                  onChange={(e) => setLobbyName(e.target.value.slice(0, 28))}
                  placeholder="MY DUNGEON"
                />
              </Field>
              <PixelButton full size="lg" onClick={() => onCreate(lobbyName)}>
                ENTER DUNGEON
              </PixelButton>
            </div>
          ) : (
            <div className="space-y-4">
              <Field label="LOBBY CODE">
                <input
                  className="px-input w-full px-3 py-3 text-[14px] tracking-[0.3em] text-center"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8))}
                  placeholder="XXXXXXXX"
                />
              </Field>
              <PixelButton
                full size="lg" variant="good"
                disabled={joinCode.length < 4}
                onClick={() => onJoin(joinCode)}
              >
                JOIN PARTY
              </PixelButton>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between border-t-2 border-px-border pt-4">
            <PixelText size="xs" color="#55678a">HERO</PixelText>
            <PixelText size="xs" color="#ffd166">{playerName}</PixelText>
          </div>
        </PixelPanel>

        {/* ---------- HOW TO PLAY ---------- */}
        <PixelPanel title="CONTROLS" className="p-4 pt-6">
          <div className="grid grid-cols-2 gap-x-5 gap-y-2">
            <Row k="WASD / ARROWS" v="MOVE" />
            <Row k="ENTER" v="SUBMIT ANSWER" />
            <Row k="STEP ON MONSTER" v="START FIGHT" />
            <Row k="SOLVE CORRECTLY" v="DEAL DAMAGE" />
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <PixelText size="xs" color="#8fa3c8" className="mb-2 block">{label}</PixelText>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <PixelText size="xs" color="#7fb2ff">{k}</PixelText>
      <PixelText size="xs" color="#55678a">{v}</PixelText>
    </div>
  );
}
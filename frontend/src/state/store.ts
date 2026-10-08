import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  ActiveEncounter, ConnectionStatus, LobbyState, LeaderboardEntry,
  Monster, PublicPlayer, Vec2,
} from '@/types/game';

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  bornAt: number;
  ttl: number;
}

export interface GameStore {
  /* connection */
  connection: ConnectionStatus;
  selfId: string | null;
  selfName: string;

  /* lobby */
  lobby: LobbyState | null;
  leaderboard: LeaderboardEntry[];

  /* world */
  players: Record<string, PublicPlayer>;
  renderPos: Record<string, Vec2>;
  monsters: Monster[];

  /* encounter */
  encounter: ActiveEncounter | null;
  encounterHistory: Array<{ id: string; correct: boolean; at: number }>;

  /* fx */
  floatingTexts: FloatingText[];
  shakeUntil: number;
  victory: { monsterName: string; xp: number; score: number; bornAt: number } | null;

  /* actions */
  setConnection: (s: ConnectionStatus) => void;
  setSelf: (id: string, name: string) => void;
  setLobby: (lobby: LobbyState) => void;
  setPlayers: (players: PublicPlayer[]) => void;
  upsertPlayer: (p: PublicPlayer) => void;
  movePlayerLocal: (id: string, to: Vec2) => void;
  setMonsters: (m: Monster[]) => void;
  setLeaderboard: (l: LeaderboardEntry[]) => void;
  setEncounterImage: (encounterId: string, imageUrl: string) => void;
  setVictory: (v: { monsterName: string; xp: number; score: number } | null) => void;

  startEncounter: (e: ActiveEncounter) => void;
  markAssetReady: (encounterId: string) => void;
  setSubmitting: (v: boolean) => void;
  setRoundResult: (correct: boolean) => void;
  endEncounter: () => void;

  addFloatingText: (t: Omit<FloatingText, 'id' | 'bornAt'>) => void;
  pruneFloatingTexts: (now: number) => void;
  triggerShake: (ms: number) => void;
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    connection: 'connecting',
    selfId: null,
    selfName: '',

    lobby: null,
    leaderboard: [],

    players: {},
    renderPos: {},
    monsters: [],

    encounter: null,
    encounterHistory: [],

    floatingTexts: [],
    shakeUntil: 0,
    victory: null,

    setConnection: (connection) => set({ connection }),
    setSelf: (selfId, selfName) => set({ selfId, selfName }),

    setLobby: (lobby) => {
      const players: Record<string, PublicPlayer> = { ...get().players };
      const renderPos: Record<string, Vec2> = { ...get().renderPos };

      for (const p of lobby.players) {
        const prev = players[p.id];
        players[p.id] = prev ? { ...prev, ...p } : p;
        if (!renderPos[p.id]) renderPos[p.id] = { x: p.x, y: p.y };
      }

      set({
        lobby,
        players,
        renderPos,
        monsters: lobby.monsters,
      });
    },

    setPlayers: (list) =>
      set((s) => {
        const players = { ...s.players };
        const renderPos = { ...s.renderPos };
        for (const p of list) {
          const prev = players[p.id];
          players[p.id] = prev ? { ...prev, ...p } : p;
          if (!renderPos[p.id]) renderPos[p.id] = { x: p.x, y: p.y };
        }
        return { players, renderPos };
      }),

    upsertPlayer: (p) =>
      set((s) => ({
        players: { ...s.players, [p.id]: p },
        renderPos: s.renderPos[p.id]
          ? s.renderPos
          : { ...s.renderPos, [p.id]: { x: p.x, y: p.y } },
      })),

    movePlayerLocal: (id, to) =>
      set((s) => ({ renderPos: { ...s.renderPos, [id]: to } })),

    /**
     * Update monsters AND clear the underlying tile for any dead monster.
     * This is the client-side counterpart to `DungeonService.killMonster`
     * on the server: without it, the killed monster's tile would keep
     * rendering as MONSTER until the next full map sync.
     */
    setMonsters: (monsters) =>
      set((s) => {
        if (!s.lobby?.map) return { monsters };

        const tiles = [...s.lobby.map.tiles];
        let changed = false;
        for (const monster of monsters) {
          if (monster.hp <= 0) {
            const index = monster.y * s.lobby.map.width + monster.x;
            if (tiles[index] === 2) {
              tiles[index] = 0;
              changed = true;
            }
          }
        }

        return changed
          ? { monsters, lobby: { ...s.lobby, map: { ...s.lobby.map, tiles } } }
          : { monsters };
      }),

    setLeaderboard: (leaderboard) => set({ leaderboard }),

    setEncounterImage: (encounterId, imageUrl) =>
      set((s) =>
        s.encounter && s.encounter.encounterId === encounterId
          ? { encounter: { ...s.encounter, imageUrl, imageReady: true } }
          : {},
      ),

    setVictory: (v) =>
      set(() =>
        v ? { victory: { ...v, bornAt: Date.now() } } : { victory: null },
      ),

    startEncounter: (e) => {
      set({ encounter: e });

      // Watchdog #1 — if the image never arrives within 15s the fetch is
      // wedged. Clear the encounter so movement unblocks immediately.
      const guardId = e.encounterId;
      setTimeout(() => {
        const cur = get().encounter;
        if (
          cur &&
          cur.encounterId === guardId &&
          !cur.imageReady &&
          !cur.lastResult
        ) {
          console.warn('[watchdog] stuck encounter cleared (no image):', guardId);
          get().endEncounter();
        }
      }, 15_000);

      // Watchdog #2 — absolute upper bound, server TTL + slack.
      setTimeout(() => {
        const cur = get().encounter;
        if (cur && cur.encounterId === guardId && !cur.lastResult) {
          get().endEncounter();
        }
      }, 135_000);
    },

    markAssetReady: (encounterId) =>
      set((s) =>
        s.encounter && s.encounter.encounterId === encounterId
          ? { encounter: { ...s.encounter, imageReady: true } }
          : {},
      ),

    setSubmitting: (submitting) =>
      set((s) => (s.encounter ? { encounter: { ...s.encounter, submitting } } : {})),

    setRoundResult: (correct) =>
      set((s) => {
        if (!s.encounter) return {};
        return {
          encounter: {
            ...s.encounter,
            lastResult: correct ? 'won' : 'lost',
            submitting: false,
          },
          encounterHistory: [
            ...s.encounterHistory.slice(-19),
            { id: s.encounter.encounterId, correct, at: Date.now() },
          ],
        };
      }),

    endEncounter: () => set({ encounter: null }),

    addFloatingText: (t) =>
      set((s) => ({
        floatingTexts: [
          ...s.floatingTexts.slice(-40),
          {
            ...t,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            bornAt: Date.now(),
          },
        ],
      })),

    pruneFloatingTexts: (now) =>
      set((s) => {
        const alive = s.floatingTexts.filter((f) => now - f.bornAt < f.ttl);
        return alive.length === s.floatingTexts.length ? {} : { floatingTexts: alive };
      }),

    triggerShake: (ms) => set({ shakeUntil: Date.now() + ms }),
  })),
);

export const selectSelf = (s: GameStore) => (s.selfId ? s.players[s.selfId] ?? null : null);
export const selectSelfPos = (s: GameStore) => (s.selfId ? s.renderPos[s.selfId] ?? null : null);
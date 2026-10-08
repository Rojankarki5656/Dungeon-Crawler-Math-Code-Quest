import { useCallback, useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';
import { useGameStore } from '@/state/store';
import { getOrCreatePlayerId, getOrCreatePlayerName } from '@/lib/storage';
import type { Direction } from '@/game/input';
import type { ActiveEncounter, LobbyState, PublicPlayer } from '@/types/game';

function toTimestamp(value: unknown, fallbackMs = Date.now() + 120_000): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallbackMs;
}

const DELTA: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

function directionFromDelta(dx: number, dy: number): Direction | null {
  if (dx > 0) return 'right';
  if (dx < 0) return 'left';
  if (dy > 0) return 'down';
  if (dy < 0) return 'up';
  return null;
}

/**
 * Single owner of the socket connection.
 *
 *  - optimistic local movement (zero-latency feel)
 *  - server reconciliation on `player:blocked`
 *  - full encounter lifecycle
 *  - reconnect + automatic lobby re-join
 *  - authoritative resync after every round resolves
 */
export function useGameSocket() {
  const socketRef = useRef<Socket | null>(null);
  const seqRef = useRef(0);
  const store = useGameStore;

  useEffect(() => {
    const set = store.getState();
    set.setSelf(getOrCreatePlayerId(), getOrCreatePlayerName());

    const socket = getSocket({
      onStatus: (s) => store.getState().setConnection(s),
    });
    socketRef.current = socket;

    /* ---------------- LIFECYCLE ---------------- */
    const onSessionReady = ({ playerId, playerName }: { playerId: string; playerName: string }) => {
      store.getState().setSelf(playerId, playerName);
    };

    const onConnect = () => {
      store.getState().setConnection('online');
      const s = store.getState();

      // Reconnect scenario — re-join the lobby so the server's session
      // regains its lobbyId. Without this every subsequent `player:move`
      // gets rejected with NOT_IN_LOBBY.
      if (s.lobby?.id && s.selfId) {
        socket.emit(
          'lobby:join',
          { lobbyId: s.lobby.id, playerName: s.selfName, playerId: s.selfId },
          (res: any) => {
            if (res?.ok !== false) {
              socket.emit('lobby:sync');
            } else {
              console.warn('[socket] rejoin failed, returning to lobby screen');
              store.getState().clearLobby();
            }
          },
        );
      }
    };

    /* ---------------- LOBBY ---------------- */
    const onLobbyJoined = (lobby: LobbyState) => {
      store.getState().setLobby(lobby);
      store.getState().setSelf(lobby.selfId, store.getState().selfName);
    };

    const onLobbyState = (payload: any) => {
      const state = store.getState();
      if (!state.lobby) return;
      state.setPlayers(payload.players as PublicPlayer[]);
    };

    const onLeaderboard = (board: any[]) => store.getState().setLeaderboard(board);

    const onPlayerJoined = () => { /* lobby:state follows */ };

    const onPlayerLeft = ({ playerId }: { playerId: string }) => {
      const s = store.getState();
      if (playerId === s.selfId) return; // ignore our own reconnect blip
      const players = { ...s.players };
      if (players[playerId]) players[playerId] = { ...players[playerId], connected: false };
      s.setPlayers(Object.values(players));
    };

    /* ---------------- MOVEMENT ---------------- */
    const onPlayerMoved = (evt: {
      playerId: string;
      from: { x: number; y: number };
      to: { x: number; y: number };
    }) => {
      const s = store.getState();
      const dir = directionFromDelta(evt.to.x - evt.from.x, evt.to.y - evt.from.y);

      s.movePlayerLocal(evt.playerId, evt.to);

      const existing = s.players[evt.playerId];
      if (existing) {
        s.upsertPlayer({
          ...existing,
          x: evt.to.x,
          y: evt.to.y,
          lastDir: dir ?? existing.lastDir,
        });
      }
    };

    const onPlayerBlocked = ({ x, y }: { x: number; y: number }) => {
      const s = store.getState();
      if (!s.selfId) return;
      s.movePlayerLocal(s.selfId, { x, y });
      const self = s.players[s.selfId];
      if (self) s.upsertPlayer({ ...self, x, y });
    };

    /* ---------------- ENCOUNTER ---------------- */
    const onEncounterTriggered = (payload: any) => {
      const encounter: ActiveEncounter = {
        encounterId: payload.encounterId,
        playerId: payload.playerId,
        monster: payload.monster,
        expiresAt: toTimestamp(payload.expiresAt),
        durationMs: Math.max(1_000, Number(payload.durationMs ?? 120_000) || 120_000),
        retry: !!payload.retry,
        attemptsLeft: payload.attemptsLeft ?? 3,
        imageReady: false,
        imageUrl: '',
        lastResult: null,
        submitting: false,
      };
      store.getState().startEncounter(encounter);
    };

    const onAssetReady = (payload: { encounterId: string; imageUrl: string }) => {
      store.getState().setEncounterImage(payload.encounterId, payload.imageUrl);
    };

    const onAssetFailed = (payload: { encounterId: string; error: string }) => {
      const s = store.getState();
      if (s.encounter?.encounterId !== payload.encounterId) return;
      s.endEncounter(payload.encounterId);
      s.addFloatingText({
        x: s.players[s.selfId ?? '']?.x ?? 0,
        y: (s.players[s.selfId ?? '']?.y ?? 0) - 1,
        text: 'QUESTION FAILED',
        color: '#e04141',
        ttl: 1600,
      });
      console.warn('[question:asset:failed]', payload);
    };

    const onRoundResult = (payload: { correct: boolean; encounterId: string }) => {
      const s = store.getState();
      if (s.encounter?.encounterId !== payload.encounterId) return;
      s.setRoundResult(payload.encounterId, payload.correct);
      s.triggerShake(payload.correct ? 0 : 260);
    };

    const onEncounterResolved = (payload: any) => {
      const s = store.getState();
      const selfId = s.selfId;

      if (selfId && payload.playerId === selfId) {
        const self = s.players[selfId];
        if (self) {
          s.upsertPlayer({ ...self, hp: payload.playerHp, score: payload.playerScore });

          s.addFloatingText({
            x: self.x,
            y: self.y - 1,
            text: payload.xpGained > 0 ? `+${payload.xpGained} XP` : 'MISS',
            color: payload.xpGained > 0 ? '#ffd166' : '#8fa3c8',
            ttl: 1200,
          });

          if (payload.monsterDefeated) {
            const monsterName =
              s.encounter?.monster?.name ??
              s.monsters.find((m) => m.id === payload.monsterId)?.name ??
              'MONSTER';
            s.setVictory({
              monsterName,
              xp: payload.xpGained ?? 0,
              score: payload.playerScore ?? self.score,
            });
          }
        }
      }

      store.getState().endEncounter(payload.encounterId);

      // Authoritative resync — guarantees the client map/tiles match the
      // server after every fight, even if `dungeon:map` was dropped.
      setTimeout(() => {
        const cur = store.getState();
        if (cur.lobby?.id) socket.emit('lobby:sync');
      }, 120);
    };

    const onDungeonMonsters = (monsters: any[]) => store.getState().setMonsters(monsters);

    const onDungeonMap = (map: any) => {
      const s = store.getState();
      if (!s.lobby) return;
      store.getState().setLobby({ ...s.lobby, map });
    };

    const onAnswerRejected = ({ reason }: { reason: string }) => {
      const s = store.getState();
      s.setSubmitting(false);
      if (!s.encounter) return;
      const self = s.selfId ? s.players[s.selfId] : null;
      s.addFloatingText({
        x: self?.x ?? 0,
        y: (self?.y ?? 0) - 1,
        text: reason ?? 'REJECTED',
        color: '#e04141',
        ttl: 1400,
      });
    };

    const onGameError = (err: any) => console.warn('[game:error]', err);

    /* ---------------- WIRING ---------------- */
    socket.on('session:ready', onSessionReady);
    socket.on('connect', onConnect);
    socket.on('lobby:joined', onLobbyJoined);
    socket.on('lobby:state', onLobbyState);
    socket.on('lobby:player:joined', onPlayerJoined);
    socket.on('lobby:player:left', onPlayerLeft);
    socket.on('leaderboard:update', onLeaderboard);
    socket.on('player:moved', onPlayerMoved);
    socket.on('player:blocked', onPlayerBlocked);
    socket.on('encounter:triggered', onEncounterTriggered);
    socket.on('question:asset:ready', onAssetReady);
    socket.on('question:asset:failed', onAssetFailed);
    socket.on('round:result', onRoundResult);
    socket.on('encounter:resolved', onEncounterResolved);
    socket.on('dungeon:monsters', onDungeonMonsters);
    socket.on('dungeon:map', onDungeonMap);
    socket.on('answer:rejected', onAnswerRejected);
    socket.on('error:game', onGameError);

    return () => {
      socket.off('session:ready', onSessionReady);
      socket.off('connect', onConnect);
      socket.off('lobby:joined', onLobbyJoined);
      socket.off('lobby:state', onLobbyState);
      socket.off('lobby:player:joined', onPlayerJoined);
      socket.off('lobby:player:left', onPlayerLeft);
      socket.off('leaderboard:update', onLeaderboard);
      socket.off('player:moved', onPlayerMoved);
      socket.off('player:blocked', onPlayerBlocked);
      socket.off('encounter:triggered', onEncounterTriggered);
      socket.off('question:asset:ready', onAssetReady);
      socket.off('question:asset:failed', onAssetFailed);
      socket.off('round:result', onRoundResult);
      socket.off('encounter:resolved', onEncounterResolved);
      socket.off('dungeon:monsters', onDungeonMonsters);
      socket.off('dungeon:map', onDungeonMap);
      socket.off('answer:rejected', onAnswerRejected);
      socket.off('error:game', onGameError);
    };
  }, [store]);

  /* ---------------- ACTIONS ---------------- */

  const move = useCallback((dir: Direction) => {
    const socket = socketRef.current;
    const s = store.getState();
    if (!socket || !s.lobby || !s.selfId) return;

    // The server owns encounter transitions. Keep movement locked for the
    // entire encounter so a result/retry cannot race with player movement.
    if (s.encounter) return;

    const self = s.players[s.selfId];
    if (!self) return;

    const { dx, dy } = DELTA[dir];
    const nx = self.x + dx;
    const ny = self.y + dy;

    const map = s.lobby.map;
    if (map) {
      const inBounds = nx >= 0 && ny >= 0 && nx < map.width && ny < map.height;
      if (!inBounds) return;
      const tile = map.tiles[ny * map.width + nx];
      const isWall = tile === 1 || tile === undefined;
      if (isWall) return;
    }

    // Optimistic local move.
    s.movePlayerLocal(s.selfId, { x: nx, y: ny });
    s.upsertPlayer({ ...self, x: nx, y: ny });

    seqRef.current += 1;
    const sentSeq = seqRef.current;

    socket.emit(
      'player:move',
      { dx, dy, seq: sentSeq },
      (res: any) => {
        if (!res || res.ok === true) return;

        if (res.error === 'NOT_IN_LOBBY') {
          console.warn('[move] server lost session — rejoining lobby');
          const cur = store.getState();
          if (cur.lobby?.id) {
            socket.emit('lobby:join', {
              lobbyId: cur.lobby.id,
              playerName: cur.selfName,
            });
          }
          return;
        }

        if (res.error === 'BLOCKED' || res.error === 'OCCUPIED' || res.error === 'IN_ENCOUNTER') {
          socket.emit('lobby:sync');
          return;
        }

        if (res.error === 'STALE_SEQ' || res.error === 'RATE_LIMITED') {
          socket.emit('lobby:sync');
          return;
        }

        console.warn('[move] rejected:', res.error);
      },
    );
  }, [store]);

  const submitAnswer = useCallback((answer: string) => {
    const socket = socketRef.current;
    const s = store.getState();
    if (!socket || !s.encounter) return;
    s.setSubmitting(true);
    socket.emit('answer:submit', {
      encounterId: s.encounter.encounterId,
      answer,
      nonce: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    });
  }, [store]);

  const abandonEncounter = useCallback(() => {
    const socket = socketRef.current;
    const encounter = store.getState().encounter;
    if (!socket || !encounter) return;

    socket.emit('encounter:abandon', { encounterId: encounter.encounterId });
    // Clear locally immediately — the server will TTL the encounter out.
    store.getState().endEncounter(encounter.encounterId);
  }, [store]);

  const createLobby = useCallback((name: string) => {
    socketRef.current?.emit(
      'lobby:create',
      {
        name,
        playerName: store.getState().selfName || getOrCreatePlayerName(),
        playerId: store.getState().selfId || getOrCreatePlayerId(),
      },
      () => undefined,
    );
  }, [store]);

  const joinLobby = useCallback((lobbyId: string) => {
    socketRef.current?.emit(
      'lobby:join',
      {
        lobbyId,
        playerName: store.getState().selfName || getOrCreatePlayerName(),
        playerId: store.getState().selfId || getOrCreatePlayerId(),
      },
      () => undefined,
    );
  }, [store]);

  const directionUpdate = useCallback((d: Direction) => {
    move(d);
  }, [move]);

  return {
    socket: socketRef,
    move,
    directionUpdate,
    submitAnswer,
    abandonEncounter,
    createLobby,
    joinLobby,
  };
}
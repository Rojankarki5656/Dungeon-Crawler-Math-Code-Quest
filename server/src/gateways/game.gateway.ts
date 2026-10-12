import {
  ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect,
  OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets';
import {
  Logger, OnApplicationBootstrap, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';

import { LobbyService } from '../modules/lobby/lobby.service';
import { DungeonService } from '../modules/dungeon/dungeon.service';
import { CombatService } from '../modules/combat/combat.service';
import { QuestionService } from '../modules/question/question.service';
import { BrokerService } from '../infra/broker/broker.service';

import { TOPICS } from '../common/constants/topics';
import { TILE, type TileId } from '../common/constants/game.constants';
import type { PlayerMovedEvent, PlayerState } from '../common/types/domain.types';
import { AuthService } from '../modules/auth/auth.service';

interface SocketSession {
  playerId: string;
  playerName: string;
  lobbyId?: string;
  lastSeq: number;
  moveWindow: number[]; // rate-limit: move timestamps
}

const MOVE_RATE_LIMIT = 20;       // max moves
const MOVE_RATE_WINDOW_MS = 1000; // per second

const FANOUT_BOOT_TIMEOUT_MS = 8_000;
const FANOUT_SUB_TIMEOUT_MS  = 4_000;

@WebSocketGateway({
  namespace: '/game',
  cors: { origin: process.env.CORS_ORIGIN?.split(',') ?? '*', credentials: true },
  transports: ['websocket', 'polling'],
  pingInterval: 10_000,
  pingTimeout: 8_000,
})
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnApplicationBootstrap
{
  private readonly logger = new Logger(GameGateway.name);

  @WebSocketServer() server!: Server;

  private readonly sessions = new Map<string, SocketSession>();

  /** Guard so fanout consumers are never registered twice (hot-reload safe). */
  private fanoutStarted = false;

  constructor(
    private readonly lobbies: LobbyService,
    private readonly dungeons: DungeonService,
    private readonly combat: CombatService,
    private readonly questions: QuestionService,
    private readonly broker: BrokerService,
    private readonly auth: AuthService,       // ← new
  ) {}

  // =======================================================================
  // LIFECYCLE
  // =======================================================================

  /**
   * Fires during SocketModule registration — BEFORE any onModuleInit hook
   * runs. Do NOT touch `broker`, `redis`, or anything that needs a running
   * Redis client here.
   *
   * Just log. The actual broker wiring happens in onApplicationBootstrap().
   */
  afterInit(_server: Server) {
    this.logger.log('WebSocket gateway initialised on namespace /game');
  }

  /**
   * Fires AFTER every provider's onModuleInit has resolved.
   * RedisService.client is guaranteed to be assigned at this point, so the
   * fanout consumer can safely subscribe to the broker.
   *
   * IMPORTANT: This hook is fire-and-forget. If we awaited the fanout here,
   * a slow/hung broker would block `app.listen()` and the HTTP server would
   * never bind — causing frontend ECONNREFUSED errors. We instead launch the
   * fanout on a background task with a hard timeout.
   */
  onApplicationBootstrap() {
    if (this.fanoutStarted) return;
    this.fanoutStarted = true;

    void this.bootFanout().catch((err) => {
      this.logger.error(`Fanout bootstrap rejected: ${(err as Error).message}`);
    });
  }

  private async bootFanout() {
    this.logger.log('Fanout bootstrap: starting...');
    const started = Date.now();

    try {
      await Promise.race([
        this.startFanoutConsumer(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Fanout bootstrap timed out after ${FANOUT_BOOT_TIMEOUT_MS}ms`)),
            FANOUT_BOOT_TIMEOUT_MS,
          ),
        ),
      ]);
      this.logger.log(
        `Broker -> WebSocket fanout consumer online (${Date.now() - started}ms)`,
      );
    } catch (err) {
      this.logger.error(
        `Fanout bootstrap FAILED after ${Date.now() - started}ms: ${(err as Error).message}`,
      );
      // Non-fatal: HTTP API stays up, live push disabled until restart.
    }
  }

  // =======================================================================
  // CONNECTION
  // =======================================================================
  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;

    // Reject unauthenticated sockets immediately.
    if (!token) {
      this.logger.warn(`Socket ${client.id} rejected: no token`);
      client.emit('auth:required', { reason: 'MISSING_TOKEN' });
      client.disconnect(true);
      return;
    }

    const user = await this.auth.verifyToken(token);
    if (!user) {
      this.logger.warn(`Socket ${client.id} rejected: invalid token`);
      client.emit('auth:required', { reason: 'INVALID_TOKEN' });
      client.disconnect(true);
      return;
    }

    // Bind the session to the authenticated user.
    this.sessions.set(client.id, {
      playerId: user.id,
      playerName: user.playerName,
      lastSeq: 0,
      moveWindow: [],
    });

    client.emit('session:ready', {
      playerId: user.id,
      playerName: user.playerName,
      email: user.email,
      socketId: client.id,
      serverTime: Date.now(),
    });

    this.logger.log(`Client connected: ${client.id} (user=${user.playerName})`);
  }

  async handleDisconnect(client: Socket) {
    const session = this.sessions.get(client.id);
    this.sessions.delete(client.id);

    if (session?.lobbyId) {
      await this.lobbies.leaveLobby(session.lobbyId, session.playerId).catch(() => undefined);
      this.server.to(session.lobbyId).emit('lobby:player:left', {
        playerId: session.playerId, at: Date.now(),
      });
      await this.broadcastLobbyState(session.lobbyId);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // =======================================================================
  // LOBBY
  // =======================================================================
  @SubscribeMessage('lobby:create')
  async onCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { name?: string; playerName?: string },
  ) {
    const session = this.sessions.get(client.id)!;
    if (body?.playerName) session.playerName = body.playerName;

    const lobby = await this.lobbies.createLobby(
      body?.name ?? 'DUNGEON OF ALGORITHMS', session.playerId, session.playerName,
    );
    session.lobbyId = lobby.id;
    await client.join(lobby.id);

    client.emit('lobby:joined', this.lobbyView(lobby, session.playerId));
    await this.broadcastLobbyState(lobby.id);
    return { ok: true, lobbyId: lobby.id, playerId: session.playerId };
  }

  @SubscribeMessage('lobby:join')
  async onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { lobbyId: string; playerName?: string },
  ) {
    const session = this.sessions.get(client.id)!;
    if (!body?.lobbyId) return { ok: false, error: 'MISSING_LOBBY_ID' };
    if (body.playerName) session.playerName = body.playerName;

    try {
      const lobby = await this.lobbies.joinLobby(
        body.lobbyId, session.playerId, session.playerName,
      );
      session.lobbyId = lobby.id;
      await client.join(lobby.id);

      client.emit('lobby:joined', this.lobbyView(lobby, session.playerId));
      this.server.to(lobby.id).emit('lobby:player:joined', {
        playerId: session.playerId, name: session.playerName, at: Date.now(),
      });
      await this.broadcastLobbyState(lobby.id);
      return { ok: true, lobbyId: lobby.id, playerId: session.playerId };
    } catch (e: any) {
      client.emit('error:game', { code: 'LOBBY_JOIN_FAILED', message: e.message });
      return { ok: false, error: e.message };
    }
  }

  @SubscribeMessage('lobby:sync')
  async onSync(@ConnectedSocket() client: Socket) {
    const session = this.sessions.get(client.id)!;
    if (!session.lobbyId) return { ok: false };

    const lobby = await this.lobbies.getLobby(session.lobbyId);
    if (!lobby) return { ok: false };

    // ✅ Always fetch fresh map + monsters from their authoritative stores.
    // The lobby record's copy is stale after any kill/respawn.
    const [freshMap, freshMonsters] = await Promise.all([
      this.dungeons.getMap(session.lobbyId),
      this.dungeons.getMonsters(session.lobbyId),
    ]);

    client.emit('lobby:joined', this.lobbyView(
      { ...lobby, map: freshMap ?? lobby.map, monsters: freshMonsters },
      session.playerId,
    ));
    return { ok: true };
  }

  // =======================================================================
  // MOVEMENT (server-authoritative)
  // =======================================================================
  @SubscribeMessage('player:move')
  async onMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { dx: number; dy: number; seq: number },
  ) {
    const session = this.sessions.get(client.id)!;
    // Defense in depth: if the socket reconnected but the client hasn't
    // re-joined yet, tell it to do so instead of silently dropping moves.
    if (!session.lobbyId) {
      client.emit('lobby:resync-required');
      return { ok: false, error: 'NOT_IN_LOBBY' };
    }
    // ---- Rate limiting ---------------------------------------------------
    const now = Date.now();
    session.moveWindow = session.moveWindow.filter((t) => now - t < MOVE_RATE_WINDOW_MS);
    if (session.moveWindow.length >= MOVE_RATE_LIMIT) {
      return { ok: false, error: 'RATE_LIMITED' };
    }
    session.moveWindow.push(now);

    // ---- Sequence validation (drop out-of-order / replayed packets) ------
    const seq = Number(body?.seq ?? 0);
    if (seq <= session.lastSeq) return { ok: false, error: 'STALE_SEQ' };
    session.lastSeq = seq;

    const player = await this.lobbies.getPlayer(session.playerId);
    if (!player) return { ok: false, error: 'PLAYER_NOT_FOUND' };

    const map = await this.dungeons.getMap(session.lobbyId);
    if (!map) return { ok: false, error: 'MAP_NOT_FOUND' };

    const nx = player.x + Math.sign(body.dx ?? 0);
    const ny = player.y + Math.sign(body.dy ?? 0);

    if (!this.dungeons.isWalkable(map, nx, ny)) {
      client.emit('player:blocked', { x: player.x, y: player.y, seq });
      return { ok: false, error: 'BLOCKED' };
    }

    // ---- Collision with another player ----------------------------------
    const lobby = await this.lobbies.getLobby(session.lobbyId);
    const occupied = lobby?.players.some(
      (p) => p.id !== player.id && p.x === nx && p.y === ny && p.connected,
    );
    if (occupied) return { ok: false, error: 'OCCUPIED' };

    const from = { x: player.x, y: player.y };
    player.x = nx;
    player.y = ny;
    player.lastSeq = seq;
    await this.lobbies.savePlayer(player);
    await this.lobbies.updatePlayerInLobby(session.lobbyId, player);

    const tile: TileId = (this.dungeons.tileAt(map, nx, ny) ?? TILE.FLOOR) as TileId;

    const evt: PlayerMovedEvent = {
      lobbyId: session.lobbyId, playerId: player.id,
      from, to: { x: nx, y: ny }, seq, tile,
    };

    // Broadcast immediately for zero perceived latency (client-side interpolation).
    this.server.to(session.lobbyId).emit('player:moved', { ...evt, name: player.name });

    // Async: hand off to the event backbone for encounter detection.
    await this.broker.publish(TOPICS.PLAYER_MOVED, evt, { safe: true });

    return { ok: true, seq, x: nx, y: ny };
  }

  // =======================================================================
  // ANSWER SUBMISSION
  // =======================================================================
  @SubscribeMessage('answer:submit')
  async onSubmit(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { encounterId: string; answer: string; nonce?: string },
  ) {
    const session = this.sessions.get(client.id)!;
    if (!session.lobbyId) return { ok: false, error: 'NOT_IN_LOBBY' };
    if (!body?.encounterId || typeof body.answer !== 'string') {
      return { ok: false, error: 'INVALID_PAYLOAD' };
    }

    const result = await this.combat.submitAnswer({
      encounterId: body.encounterId,
      playerId: session.playerId,
      answer: body.answer.slice(0, 64),
      nonce: body.nonce ?? randomUUID(),
    });

    if (!result.accepted) {
      client.emit('answer:rejected', { encounterId: body.encounterId, reason: result.reason });
      return result;
    }
    return { ok: true, accepted: true };
  }

  @SubscribeMessage('encounter:abandon')
  async onAbandon(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { encounterId: string },
  ) {
    const session = this.sessions.get(client.id)!;
    if (!session.lobbyId) return { ok: false, error: 'NOT_IN_LOBBY' };
    if (!body?.encounterId) return { ok: false, error: 'INVALID_PAYLOAD' };

    return this.combat.abandonEncounter({
      encounterId: body.encounterId,
      playerId: session.playerId,
    });
  }

  // =======================================================================
  // UTILITIES
  // =======================================================================
  @SubscribeMessage('ping')
  onPing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { serverTime: Date.now() });
  }

  private lobbyView(lobby: any, selfId: string) {
    return {
      id: lobby.id,
      name: lobby.name,
      hostId: lobby.hostId,
      status: lobby.status,
      players: lobby.players,
      map: lobby.map,
      monsters: lobby.monsters,
      selfId,
    };
  }

  private async broadcastLobbyState(lobbyId: string) {
    const lobby = await this.lobbies.getLobby(lobbyId);
    if (!lobby) return;
    this.server.to(lobbyId).emit('lobby:state', {
      id: lobby.id, status: lobby.status,
      players: lobby.players.map((p) => ({
        id: p.id, name: p.name,
        x: p.x, y: p.y,              // ← ADD THESE
        hp: p.hp, maxHp: p.maxHp,
        score: p.score, connected: p.connected,
      })),
      at: Date.now(),
    });
    const board = await this.lobbies.leaderboard(lobbyId);
    this.server.to(lobbyId).emit('leaderboard:update', board);
  }

  // =======================================================================
  // BROKER -> WEBSOCKET FANOUT
  // =======================================================================
  private async startFanoutConsumer() {
    const group = this.broker.fanoutGroup('ws-fanout');
    this.logger.log(`Fanout group: ${group}`);

    const sub = async <T>(
      topic: string,
      handler: (msg: { payload: T }) => Promise<void> | void,
    ) => {
      const t0 = Date.now();
      this.logger.log(`Fanout: subscribing to ${topic}...`);
      try {
        await Promise.race([
          this.broker.subscribe<T>(topic, group, handler as any, { maxAttempts: 2 }),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error(`subscribe(${topic}) timed out after ${FANOUT_SUB_TIMEOUT_MS}ms`)),
              FANOUT_SUB_TIMEOUT_MS,
            ),
          ),
        ]);
        this.logger.log(`Fanout: subscribed to ${topic} (${Date.now() - t0}ms)`);
      } catch (err) {
        this.logger.error(
          `Fanout: FAILED to subscribe ${topic} after ${Date.now() - t0}ms: ${(err as Error).message}`,
        );
        throw err;
      }
    };

    // Encounter began → tell the client a fight is starting (no question yet).
    await sub<any>(TOPICS.ENCOUNTER_TRIGGERED, (msg) => {
      const p = msg.payload;
      this.server.to(p.lobbyId).emit('encounter:triggered', {
        encounterId: p.encounterId,
        playerId: p.playerId,
        monster: p.monster,
        expiresAt: p.expiresAt,
        retry: !!p.retry,
        attemptsLeft: p.attemptsLeft ?? 3,
      });
    });

    // Question asset ready → deliver the image URL to the lobby.
    await sub<any>(TOPICS.QUESTION_FETCH_COMPLETED, (msg) => {
      const p = msg.payload;
      this.server.to(p.lobbyId).emit('question:asset:ready', {
        encounterId: p.encounterId,
        imageUrl: p.imageUrl,
      });
    });

    // Question fetch failed → notify the lobby so it can show a retry hint.
    await sub<any>(TOPICS.QUESTION_FETCH_FAILED, (msg) => {
      const p = msg.payload;
      this.server.to(p.lobbyId).emit('question:asset:failed', {
        encounterId: p.encounterId,
        error: p.error,
      });
    });

    await sub<any>(TOPICS.ROUND_WON, (msg) => {
      const p = msg.payload;
      this.server.to(p.lobbyId).emit('round:result', {
        encounterId: p.encounterId, correct: true, at: Date.now(),
      });
    });

    await sub<any>(TOPICS.ROUND_LOST, (msg) => {
      const p = msg.payload;
      this.server.to(p.lobbyId).emit('round:result', {
        encounterId: p.encounterId, correct: false, at: Date.now(),
      });
    });

    await sub<any>(TOPICS.ENCOUNTER_RESOLVED, async (msg) => {
      const p = msg.payload;
      this.server.to(p.lobbyId).emit('encounter:resolved', p);

      // ✅ Push the updated map so killed-monster tiles become FLOOR.
      const map = await this.dungeons.getMap(p.lobbyId);
      if (map) {
        this.server.to(p.lobbyId).emit('dungeon:map', map);
      }

      const lobby = await this.lobbies.getLobby(p.lobbyId);
      if (lobby?.map) {
        const monsters = await this.dungeons.getMonsters(p.lobbyId);
        this.server.to(p.lobbyId).emit('dungeon:monsters', monsters);
      }
      await this.broadcastLobbyState(p.lobbyId);
    });

    await sub<any>(TOPICS.LOBBY_STATE_CHANGED, async (msg) => {
      const p = msg.payload;
      if (p.reason !== 'lobby.state.sync') await this.broadcastLobbyState(p.lobbyId);
    });
  }
}
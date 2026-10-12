import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RedisService } from '../../infra/redis/redis.service';
import { BrokerService } from '../../infra/broker/broker.service';
import { DungeonService } from '../dungeon/dungeon.service';
import { PLAYER } from '../../common/constants/game.constants';
import { TOPICS } from '../../common/constants/topics';
import type { LobbyState, PlayerState } from '../../common/types/domain.types';

@Injectable()
export class LobbyService {
  private readonly logger = new Logger(LobbyService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly broker: BrokerService,
    private readonly dungeon: DungeonService,
  ) {}

  async createLobby(name: string, hostId: string, hostName: string): Promise<LobbyState> {
    const id = randomUUID().slice(0, 8);
    const seed = Math.floor(Math.random() * 2 ** 31);
    const { map, monsters } = await this.dungeon.createForLobby(id, seed);

    const host: PlayerState = {
      id: hostId,
      name: hostName,
      x: map.spawn.x,
      y: map.spawn.y,
      hp: PLAYER.MAX_HP,
      maxHp: PLAYER.MAX_HP,
      score: PLAYER.START_SCORE,
      lobbyId: id,
      connected: true,
      lastSeq: 0,
    };

    const lobby: LobbyState = {
      id, name, hostId,
      players: [host],
      map, monsters,
      status: 'waiting',
      createdAt: Date.now(),
    };

    await this.persist(lobby);
    await this.redis.hsetJson(this.redis.key('player', hostId), 'state', host, 7200);
    await this.publishChange(lobby, 'lobby.created');
    this.logger.log(`Lobby ${id} created by ${hostName}`);
    return lobby;
  }

  async joinLobby(lobbyId: string, playerId: string, playerName: string): Promise<LobbyState> {
    const lobby = await this.getLobby(lobbyId);
    if (!lobby) throw new NotFoundException('Lobby not found');

    let player = lobby.players.find((p) => p.id === playerId);
    if (player) {
      player.connected = true;
      player.name = playerName;
    } else {
      const spawn = lobby.map?.spawn ?? { x: 1, y: 1 };
      player = {
        id: playerId, name: playerName,
        x: spawn.x, y: spawn.y,
        hp: PLAYER.MAX_HP, maxHp: PLAYER.MAX_HP,
        score: PLAYER.START_SCORE,
        lobbyId, connected: true, lastSeq: 0,
      };
      lobby.players.push(player);
    }

    if (lobby.status === 'waiting' && lobby.players.length >= 1) lobby.status = 'running';

    await this.persist(lobby);
    await this.redis.hsetJson(this.redis.key('player', playerId), 'state', player, 7200);
    await this.publishChange(lobby, 'lobby.joined');
    return lobby;
  }

  async leaveLobby(lobbyId: string, playerId: string): Promise<void> {
    const lobby = await this.getLobby(lobbyId);
    if (!lobby) return;
    const player = lobby.players.find((p) => p.id === playerId);
    if (player) player.connected = false;
    await this.persist(lobby);
    await this.publishChange(lobby, 'lobby.left');
    await this.broker.publish(TOPICS.PLAYER_LEFT, { lobbyId, playerId }, { safe: true });
  }

  async getLobby(lobbyId: string): Promise<LobbyState | null> {
    return this.redis.getJson<LobbyState>(this.redis.key('lobby', lobbyId));
  }

  async getPlayer(playerId: string): Promise<PlayerState | null> {
    return this.redis.hgetJson<PlayerState>(this.redis.key('player', playerId), 'state');
  }

  async savePlayer(player: PlayerState): Promise<void> {
    await this.redis.hsetJson(this.redis.key('player', player.id), 'state', player, 7200);
  }

  async updatePlayerInLobby(lobbyId: string, player: PlayerState): Promise<void> {
    const lobby = await this.getLobby(lobbyId);
    if (!lobby) return;
    const i = lobby.players.findIndex((p) => p.id === player.id);
    if (i >= 0) lobby.players[i] = player; else lobby.players.push(player);
    await this.persist(lobby);
  }

  async leaderboard(lobbyId: string) {
    const lobby = await this.getLobby(lobbyId);
    if (!lobby) return [];
    return [...lobby.players]
      .sort((a, b) => b.score - a.score || b.hp - a.hp)
      .slice(0, 10)
      .map((p, i) => ({ rank: i + 1, id: p.id, name: p.name, score: p.score, hp: p.hp }));
  }

  private async persist(lobby: LobbyState) {
    await this.redis.setJson(this.redis.key('lobby', lobby.id), lobby, 7200);
  }

  private async publishChange(lobby: LobbyState, reason: string) {
    await this.broker.publish(TOPICS.LOBBY_STATE_CHANGED, {
      lobbyId: lobby.id,
      reason,
      players: lobby.players,
      status: lobby.status,
      at: Date.now(),
    }, { safe: true });
  }
}
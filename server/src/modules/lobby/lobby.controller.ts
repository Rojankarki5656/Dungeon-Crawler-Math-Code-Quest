import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LobbyService } from './lobby.service';

class CreateLobbyDto { name!: string; playerName!: string; }
class JoinLobbyDto { playerName!: string; playerId?: string; }

@Controller('api/lobbies')
export class LobbyController {
  constructor(private readonly lobbies: LobbyService) {}

  @Post()
  async create(@Body() dto: CreateLobbyDto) {
    const hostId = randomUUID();
    const lobby = await this.lobbies.createLobby(dto.name ?? 'DUNGEON', hostId, dto.playerName ?? 'HERO');
    return { ok: true, lobbyId: lobby.id, playerId: hostId, lobby: this.publicView(lobby) };
  }

  @Post(':id/join')
  async join(@Param('id') id: string, @Body() dto: JoinLobbyDto) {
    const playerId = dto.playerId ?? randomUUID();
    const lobby = await this.lobbies.joinLobby(id, playerId, dto.playerName ?? 'HERO');
    return { ok: true, lobbyId: lobby.id, playerId, lobby: this.publicView(lobby) };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const lobby = await this.lobbies.getLobby(id);
    return lobby ? this.publicView(lobby) : null;
  }

  @Get(':id/leaderboard')
  leaderboard(@Param('id') id: string) {
    return this.lobbies.leaderboard(id);
  }

  private publicView(lobby: any) {
    return {
      id: lobby.id,
      name: lobby.name,
      hostId: lobby.hostId,
      status: lobby.status,
      players: lobby.players,
      map: lobby.map,
      monsters: lobby.monsters,
    };
  }
}
import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { DungeonService } from './dungeon.service';

@Controller('api/dungeons')
export class DungeonController {
  constructor(private readonly dungeons: DungeonService) {}

  @Get(':lobbyId')
  async get(@Param('lobbyId') lobbyId: string) {
    const map = await this.dungeons.getMap(lobbyId);
    if (!map) throw new NotFoundException('Dungeon not found');
    const monsters = await this.dungeons.getMonsters(lobbyId);
    return { map, monsters };
  }
}
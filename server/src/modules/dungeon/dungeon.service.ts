import { Injectable } from '@nestjs/common';
import { RedisService } from '../../infra/redis/redis.service';
import { generateDungeon } from './map.generator';
import { MONSTER_ARCHETYPES, PLAYER, TILE } from '../../common/constants/game.constants';
import { Rng } from '../../common/utils/prng';
import type { DungeonMap, Monster, Vec2 } from '../../common/types/domain.types';

@Injectable()
export class DungeonService {
  constructor(private readonly redis: RedisService) {}

  async createForLobby(lobbyId: string, seed: number): Promise<{
    map: DungeonMap; monsters: Monster[];
  }> {
    const map = generateDungeon(seed);
    const monsters = this.spawnMonsters(map, seed);
    await this.redis.setJson(this.redis.key('map', lobbyId), map);
    await this.redis.setJson(this.redis.key('monsters', lobbyId), monsters);
    return { map, monsters };
  }

  async getMap(lobbyId: string): Promise<DungeonMap | null> {
    return this.redis.getJson<DungeonMap>(this.redis.key('map', lobbyId));
  }

  async getMonsters(lobbyId: string): Promise<Monster[]> {
    return (await this.redis.getJson<Monster[]>(this.redis.key('monsters', lobbyId))) ?? [];
  }

  async saveMonsters(lobbyId: string, monsters: Monster[]) {
    await this.redis.setJson(this.redis.key('monsters', lobbyId), monsters);
  }

  /** Returns the tile at (x,y), or null when out of bounds. */
  tileAt(map: DungeonMap, x: number, y: number): number | null {
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) return null;
    return map.tiles[y * map.width + x];
  }

  isWalkable(map: DungeonMap, x: number, y: number): boolean {
    const t = this.tileAt(map, x, y);
    return t !== null && t !== TILE.WALL;
  }

  monsterAt(monsters: Monster[], x: number, y: number): Monster | undefined {
    return monsters.find((m) => m.x === x && m.y === y && m.hp > 0);
  }

  async killMonster(lobbyId: string, monsterId: string): Promise<Monster | null> {
    const monsters = await this.getMonsters(lobbyId);
    const target = monsters.find((m) => m.id === monsterId);
    if (!target) return null;
    target.hp = 0;
    await this.saveMonsters(lobbyId, monsters);

    // Remove the monster tile so it can't be re-encountered.
    const map = await this.getMap(lobbyId);
    if (map) {
      const i = target.y * map.width + target.x;
      if (map.tiles[i] === TILE.MONSTER) map.tiles[i] = TILE.FLOOR;
      await this.redis.setJson(this.redis.key('map', lobbyId), map);
    }
    return target;
  }

  private spawnMonsters(map: DungeonMap, seed: number): Monster[] {
    const rng = new Rng(seed ^ 0x9e3779b9);
    const monsters: Monster[] = [];
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (map.tiles[y * map.width + x] !== TILE.MONSTER) continue;
        // Difficulty scales with distance from spawn.
        const dist = Math.abs(x - map.spawn.x) + Math.abs(y - map.spawn.y);
        const tier = dist > 30 ? 3 : dist > 18 ? 2 : 1;
        const pool = MONSTER_ARCHETYPES.filter((a) => a.difficulty <= tier);
        const archetype = rng.pick(pool.length ? pool : MONSTER_ARCHETYPES);
        const variance = rng.float(0.9, 1.15);
        const hp = Math.round(archetype.hp * variance);
        monsters.push({
          id: `m-${x}-${y}`,
          archetype: archetype.id,
          name: archetype.name,
          x, y,
          hp,
          maxHp: hp,
          damage: archetype.damage,
          difficulty: archetype.difficulty,
          color: archetype.color,
        });
      }
    }
    return monsters;
  }
}
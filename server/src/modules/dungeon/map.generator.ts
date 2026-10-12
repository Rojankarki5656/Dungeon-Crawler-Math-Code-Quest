import { MAP, TILE, type TileId } from '../../common/constants/game.constants';
import { Rng } from '../../common/utils/prng';
import type { DungeonMap, Vec2 } from '../../common/types/domain.types';

interface Room { x: number; y: number; w: number; h: number; }

/**
 * Deterministic rooms-and-corridors generator.
 * Same seed => identical map on every client & every server restart.
 */
export function generateDungeon(seed: number): DungeonMap {
  const rng = new Rng(seed);
  const width = MAP.WIDTH;
  const height = MAP.HEIGHT;
  const tiles: TileId[] = new Array(width * height).fill(TILE.WALL);

  const idx = (x: number, y: number) => y * width + x;
  const rooms: Room[] = [];

  const overlaps = (a: Room, b: Room) =>
    a.x - 1 < b.x + b.w + 1 && a.x + a.w + 1 > b.x - 1 &&
    a.y - 1 < b.y + b.h + 1 && a.y + a.h + 1 > b.y - 1;

  const carveRoom = (r: Room) => {
    for (let y = r.y; y < r.y + r.h; y++)
      for (let x = r.x; x < r.x + r.w; x++) tiles[idx(x, y)] = TILE.FLOOR;
  };

  const carveCorridor = (a: Vec2, b: Vec2) => {
    let { x, y } = a;
    const horizFirst = rng.chance(0.5);
    const stepX = () => { while (x !== b.x) { x += Math.sign(b.x - x); tiles[idx(x, y)] = TILE.FLOOR; } };
    const stepY = () => { while (y !== b.y) { y += Math.sign(b.y - y); tiles[idx(x, y)] = TILE.FLOOR; } };
    if (horizFirst) { stepX(); stepY(); } else { stepY(); stepX(); }
  };

  // --- Place rooms ------------------------------------------------------
  for (let attempt = 0; attempt < 220 && rooms.length < MAP.MAX_ROOMS; attempt++) {
    const w = rng.int(MAP.MIN_ROOM, MAP.MAX_ROOM);
    const h = rng.int(MAP.MIN_ROOM, MAP.MAX_ROOM);
    const x = rng.int(1, width - w - 2);
    const y = rng.int(1, height - h - 2);
    const candidate: Room = { x, y, w, h };
    if (rooms.some((r) => overlaps(r, candidate))) continue;
    rooms.push(candidate);
    carveRoom(candidate);
  }

  // --- Connect rooms ----------------------------------------------------
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1], b = rooms[i];
    carveCorridor(
      { x: Math.floor(a.x + a.w / 2), y: Math.floor(a.y + a.h / 2) },
      { x: Math.floor(b.x + b.w / 2), y: Math.floor(b.y + b.h / 2) },
    );
  }
  // Extra loops so the map isn't a pure tree (better exploration feel).
  for (let i = 0; i < 3 && rooms.length > 3; i++) {
    const a = rng.pick(rooms), b = rng.pick(rooms);
    carveCorridor(
      { x: Math.floor(a.x + a.w / 2), y: Math.floor(a.y + a.h / 2) },
      { x: Math.floor(b.x + b.w / 2), y: Math.floor(b.y + b.h / 2) },
    );
  }

  const spawn: Vec2 = {
    x: Math.floor(rooms[0].x + rooms[0].w / 2),
    y: Math.floor(rooms[0].y + rooms[0].h / 2),
  };
  const last = rooms[rooms.length - 1];
  const exit: Vec2 = {
    x: Math.floor(last.x + last.w / 2),
    y: Math.floor(last.y + last.h / 2),
  };
  tiles[idx(exit.x, exit.y)] = TILE.EXIT;

  // --- Populate ---------------------------------------------------------
  const floorTiles: Vec2[] = [];
  for (let y = 1; y < height - 1; y++)
    for (let x = 1; x < width - 1; x++)
      if (tiles[idx(x, y)] === TILE.FLOOR) floorTiles.push({ x, y });

  const takeFloor = (minDistFromSpawn = 6): Vec2 | null => {
    for (let i = 0; i < 400; i++) {
      const t = rng.pick(floorTiles);
      if (Math.abs(t.x - spawn.x) + Math.abs(t.y - spawn.y) < minDistFromSpawn) continue;
      if (tiles[idx(t.x, t.y)] !== TILE.FLOOR) continue;
      return t;
    }
    return null;
  };

  for (let i = 0; i < MAP.MONSTER_COUNT; i++) {
    const t = takeFloor(7);
    if (t) tiles[idx(t.x, t.y)] = TILE.MONSTER;
  }
  for (let i = 0; i < MAP.DOOR_COUNT; i++) {
    const t = takeFloor(9);
    if (t) tiles[idx(t.x, t.y)] = TILE.DOOR;
  }
  for (let i = 0; i < MAP.CHEST_COUNT; i++) {
    const t = takeFloor(5);
    if (t) tiles[idx(t.x, t.y)] = TILE.CHEST;
  }

  return { seed, width, height, tiles, spawn, exit };
}
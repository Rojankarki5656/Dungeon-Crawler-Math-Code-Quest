export const TILE = 32;
export const MAP_W = 40;
export const MAP_H = 28;
export const PLAYER_START = { x: 20, y: 14 };

/** Deterministic dungeon layout — every client renders the same map. */
export function generateMap() {
  const g = [];
  for (let y = 0; y < MAP_H; y++) {
    const row = [];
    for (let x = 0; x < MAP_W; x++) {
      const border = x === 0 || y === 0 || x === MAP_W - 1 || y === MAP_H - 1;
      row.push(border ? 1 : 0);
    }
    g.push(row);
  }

  // Four symmetric pillars
  const pillars = [
    [8, 6], [8, 20], [30, 6], [30, 20],
    [15, 10], [24, 10], [15, 17], [24, 17],
  ];
  for (const [px, py] of pillars) {
    for (let dy = 0; dy < 2; dy++)
      for (let dx = 0; dx < 2; dx++)
        if (py + dy < MAP_H - 1 && px + dx < MAP_W - 1) g[py + dy][px + dx] = 1;
  }

  // A short inner wall segment for flavour
  for (let x = 18; x <= 22; x++) g[6][x] = 1;
  for (let x = 18; x <= 22; x++) g[MAP_H - 7][x] = 1;

  return g;
}

/** Pseudo-random hash for deterministic spawn layout. */
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Assign a deterministic floor tile to each monster instance.
 * Uses roomCode + instanceId as seed so every client draws the same monster
 * in the same place, independent of load order.
 */
export function assignMonsterPositions(grid, roomCode, monsters) {
  const openTiles = [];
  for (let y = 2; y < MAP_H - 2; y++)
    for (let x = 2; x < MAP_W - 2; x++)
      if (grid[y][x] === 0) openTiles.push({ x, y });

  const farFromStart = openTiles.filter(
    (t) => Math.abs(t.x - PLAYER_START.x) > 3 || Math.abs(t.y - PLAYER_START.y) > 3
  );

  const taken = new Set();
  const sorted = [...monsters].sort((a, b) => a.instanceId.localeCompare(b.instanceId));
  return sorted.map((m) => {
    const rand = mulberry32(hashString(`${roomCode}:${m.instanceId}`));
    let pick = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      const idx = Math.floor(rand() * farFromStart.length);
      const candidate = farFromStart[idx];
      const key = `${candidate.x},${candidate.y}`;
      if (!taken.has(key)) { taken.add(key); pick = candidate; break; }
    }
    if (!pick) {
      const fallback = farFromStart.find((t) => !taken.has(`${t.x},${t.y}`));
      pick = fallback || { x: 5, y: 5 };
      taken.add(`${pick.x},${pick.y}`);
    }
    return { ...m, tileX: pick.x, tileY: pick.y };
  });
}
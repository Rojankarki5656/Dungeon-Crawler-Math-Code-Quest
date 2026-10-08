export const TILE = {
  FLOOR: 0,
  WALL: 1,
  MONSTER: 2,
  DOOR: 3,
  EXIT: 4,
  CHEST: 5,
} as const;

export const TILE_NAMES: Record<number, string> = {
  0: 'FLOOR', 1: 'WALL', 2: 'MONSTER', 3: 'DOOR', 4: 'EXIT', 5: 'CHEST',
};
export interface Vec2 { x: number; y: number; }

export type TileId = 0 | 1 | 2 | 3 | 4 | 5;

export interface DungeonMap {
  seed: number;
  width: number;
  height: number;
  tiles: TileId[];
  spawn: Vec2;
  exit: Vec2;
}

export interface Monster {
  id: string;
  archetype: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  damage: number;
  difficulty: number;
  color: string;
}

export interface PublicQuestion {
  id: string;
  imageUrl: string;
  damage: number;
  difficulty: 1 | 2 | 3;
  kind: 'banana';
}

export interface ActiveEncounter {
  encounterId: string;
  playerId: string;
  monster: Monster;
  expiresAt: number;
  durationMs: number;
  retry: boolean;
  attemptsLeft: number;
  imageReady: boolean;
  imageUrl: string;
  lastResult: 'won' | 'lost' | null;
  submitting: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  score: number;
  hp: number;
}

export interface LobbyState {
  id: string;
  name: string;
  hostId: string;
  status: string;
  players: PublicPlayer[];
  map: DungeonMap | null;
  monsters: Monster[];
  selfId: string;
}

export type ConnectionStatus = 'connecting' | 'online' | 'reconnecting' | 'offline';

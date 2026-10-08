import type { MonsterArchetypeId, TileId } from '../constants/game.constants';

export interface Vec2 { x: number; y: number; }

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
  archetype: MonsterArchetypeId;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  damage: number;
  difficulty: number;
  color: string;
}

export interface PlayerState {
  id: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  score: number;
  lobbyId: string;
  connected: boolean;
  lastSeq: number;
}

/**
 * Encounter — the server-side record of a single player-vs-monster fight.
 *
 * `id` doubles as the key under which the question solution lives, so there
 * is no separate questionId. When the encounter is created, `solution` and
 * `imageUrl` are empty; the FetchWorker populates them asynchronously.
 */
export interface Encounter {
  id: string;
  lobbyId: string;
  playerId: string;
  monsterId: string;
  /** Filled by FetchWorker. Empty string means "not ready yet". */
  solution: string;
  /** Filled by FetchWorker. Absolute URL to the Banana PNG. */
  imageUrl: string;
  /** Damage dealt on a correct answer — computed from monster difficulty. */
  questionDamage: number;
  status: 'pending' | 'won' | 'lost' | 'expired';
  attempts: number;
  createdAt: number;
  expiresAt: number;
}

/** Returned by QuestionRepository — the subset the FetchWorker cares about. */
export interface FetchedQuestion {
  imageUrl: string;
  solution: string;
  damage: number;
  difficulty: 1 | 2 | 3;
}

export interface LobbyState {
  id: string;
  name: string;
  hostId: string;
  players: PlayerState[];
  map: DungeonMap | null;
  monsters: Monster[];
  status: 'waiting' | 'running' | 'finished';
  createdAt: number;
}

/* ==========================================================================
   Event payload contracts
   ========================================================================== */

export interface PlayerMovedEvent {
  lobbyId: string;
  playerId: string;
  from: Vec2;
  to: Vec2;
  seq: number;
  tile: TileId;
}

export interface EncounterTriggeredEvent {
  encounterId: string;
  lobbyId: string;
  playerId: string;
  monster: Monster;
  expiresAt: number;
  retry?: boolean;
  attemptsLeft?: number;
}

export interface AnswerSubmittedEvent {
  encounterId: string;
  playerId: string;
  lobbyId: string;
  answer: string;
  nonce: string;
  submittedAt: number;
}

export interface RoundResultEvent {
  encounterId: string;
  lobbyId: string;
  playerId: string;
  correct: boolean;
  damageDealt: number;
}

export interface EncounterResolvedEvent {
  encounterId: string;
  lobbyId: string;
  playerId: string;
  monsterId: string;
  monsterDefeated: boolean;
  playerHp: number;
  playerScore: number;
  xpGained: number;
}

export interface QuestionFetchRequestedEvent {
  encounterId: string;
  difficulty: 1 | 2 | 3;
}

export interface QuestionFetchCompletedEvent {
  encounterId: string;
  lobbyId: string;
  imageUrl: string;
  cachedAt: number;
}

export interface QuestionFetchFailedEvent {
  encounterId: string;
  lobbyId: string;
  error: string;
  at: number;
}
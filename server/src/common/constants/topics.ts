/**
 * Central Event Topic Registry.
 * Every cross-module interaction goes through these topics — no direct coupling.
 */
export const TOPICS = {
  // Movement / exploration
  PLAYER_MOVED: 'player.moved',
  PLAYER_JOINED: 'player.joined',
  PLAYER_LEFT: 'player.left',

  // Encounter lifecycle
  ENCOUNTER_TRIGGERED: 'encounter.triggered',
  ENCOUNTER_RESOLVED: 'encounter.resolved',

  // Question asset pipeline (async — never blocks the game loop)
  QUESTION_FETCH_REQUESTED: 'question.fetch.requested',
  QUESTION_FETCH_COMPLETED: 'question.fetch.completed',
  QUESTION_FETCH_FAILED: 'question.fetch.failed',

  // Answer pipeline
  ANSWER_SUBMITTED: 'answer.submitted',
  ROUND_WON: 'round.won',
  ROUND_LOST: 'round.lost',

  // Lobby / sync
  LOBBY_STATE_CHANGED: 'lobby.state.changed',
  LEADERBOARD_UPDATED: 'leaderboard.updated',

  // Ops
  DEAD_LETTER: 'dead.letter',
} as const;

export type Topic = (typeof TOPICS)[keyof typeof TOPICS];

/** Consumer groups (shared group => work queue, unique group => fanout). */
export const GROUPS = {
  VALIDATION_WORKERS: 'validation-workers',
  FETCH_WORKERS: 'fetch-workers',
  COMBAT_WORKERS: 'combat-workers',
  DLQ_WORKERS: 'dlq-workers',
  /** Prefix — each API instance appends its own id for true fanout. */
  WS_FANOUT: 'ws-fanout',
} as const;
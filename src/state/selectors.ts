import type { GameStore } from './store';

export const selectPlayerList = (s: GameStore) => Object.values(s.players);
export const selectAliveMonsters = (s: GameStore) => s.monsters.filter((m) => m.hp > 0);
export const selectSelfPlayer = (s: GameStore) =>
  s.selfId ? s.players[s.selfId] ?? null : null;
export const selectIsEncounterActive = (s: GameStore) => s.encounter !== null;
export const selectSelfHpPct = (s: GameStore) => {
  const p = selectSelfPlayer(s);
  return p ? Math.max(0, p.hp / p.maxHp) : 0;
};
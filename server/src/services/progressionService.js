import { GameEvent } from "../models/GameEvent.js";
import { eventBus } from "../events/eventBus.js";
import { EVENTS } from "../events/eventTypes.js";
import { logger } from "../config/logger.js";

/**
 * Configurable XP thresholds. Index N = total XP required to REACH level N+1.
 * Tweak freely; everything else derives from this table.
 *   Lv1: 0, Lv2: 100, Lv3: 250, Lv4: 500, Lv5: 900, Lv6: 1500, ...
 */
export const XP_THRESHOLDS = Object.freeze([0, 100, 250, 500, 900, 1500]);
export const MAX_LEVEL = XP_THRESHOLDS.length;

/** Total XP required to reach a given level (level 1 = 0). */
export function xpToReachLevel(level) {
  if (level <= 1) return 0;
  if (level > MAX_LEVEL) {
    // Extrapolate beyond the table: +750 * (level - MAX_LEVEL) per extra tier
    const base = XP_THRESHOLDS[MAX_LEVEL - 1];
    const extra = 750 * (level - MAX_LEVEL);
    return base + extra;
  }
  return XP_THRESHOLDS[level - 1];
}

/** Reverse lookup: what level has this much total XP earned? */
export function getLevelFromXp(totalXp) {
  const xp = Math.max(0, Number(totalXp) || 0);
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpToReachLevel(level + 1)) level++;
  return level;
}

/** Progress summary for UI progress bars. */
export function xpProgressForLevel(user) {
  const current = xpToReachLevel(user.level);
  const next = xpToReachLevel(user.level + 1);
  const span = Math.max(1, next - current);
  return {
    level: user.level,
    xp: user.xp,
    intoLevel: Math.max(0, user.xp - current),
    neededForNext: Math.max(0, next - user.xp),
    span,
    percent: Math.min(100, Math.round(((user.xp - current) / span) * 100)),
  };
}

/**
 * Apply XP to a user document in-place and handle level-up side effects.
 * Mutates `user` but does NOT save — the caller owns persistence.
 * Returns { leveledUp, newLevel, levelsGained }.
 */
export async function applyXp(user, amount) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { leveledUp: false, newLevel: user.level, levelsGained: 0 };
  }
  const before = user.level;
  user.xp += amount;
  const after = getLevelFromXp(user.xp);
  if (after > before) {
    user.level = after;
    user.maxHealth = 100 + (after - 1) * 10;
    user.health = user.maxHealth; // full heal on level-up
    // Emit after the caller persists? We emit here so listeners may
    // perform additional (eventually consistent) work like achievements.
    // The critical level change is saved by the caller.




    try {
      /// this can be  used for level up rewards also
      await eventBus.emitAsync(EVENTS.PLAYER_LEVEL_UP, {
        userId: user._id,
        fromLevel: before,
        toLevel: after,
      });
    } catch (err) {
      logger.error({ err }, "PLAYER_LEVEL_UP emit failed");
    }
    await GameEvent.create({
      type: EVENTS.PLAYER_LEVEL_UP,
      player: user._id,
      metadata: { fromLevel: before, toLevel: after },
    }).catch((err) => logger.error({ err }, "level-up event persist failed"));
    return { leveledUp: true, newLevel: after, levelsGained: after - before };
  }
  return { leveledUp: false, newLevel: after, levelsGained: 0 };
}
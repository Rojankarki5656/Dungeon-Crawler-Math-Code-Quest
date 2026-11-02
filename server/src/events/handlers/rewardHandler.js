import { eventBus } from "../eventBus.js";
import { EVENTS } from "../eventTypes.js";
import { User } from "../../models/User.js";
import { applyXp } from "../../services/progressionService.js";
import { grantDrops } from "../../services/inventoryService.js";
import { logger } from "../../config/logger.js";

/**
 * Single grant point for monster-kill rewards.
 * Phase 3 emitters MUST NOT grant xp/coins/stats themselves, only emit.
 * Idempotency is the emitter's responsibility (one MONSTER_DEFEATED per kill).
 */
eventBus.on(EVENTS.MONSTER_DEFEATED, async ({ userId, monsterId, xpReward = 0, coinReward = 0, drops = [] }) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    user.stats.totalMonstersDefeated += 1;
    user.coins += coinReward;
    await applyXp(user, xpReward);
    await user.save();
    if (drops.length) await grantDrops(userId, drops);
    logger.debug({ userId, monsterId, xpReward, coinReward }, "rewards granted");
  } catch (err) {
    logger.error({ err, userId, monsterId }, "rewardHandler failed");
  }
});
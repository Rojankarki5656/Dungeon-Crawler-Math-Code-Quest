import mongoose from "mongoose";
import { Question } from "../models/Question.js";
import { GameRoom } from "../models/GameRoom.js";
import { User } from "../models/User.js";
import { NotFoundError, GameStateError } from "../errors/index.js";
import { eventBus } from "../events/eventBus.js";
import { EVENTS } from "../events/eventTypes.js";
import { logger } from "../config/logger.js";

const PLAYER_HIT_DAMAGE = 25;

function normalise(v) {
  const s = String(v).trim().toLowerCase();
  const n = Number(s);
  return Number.isFinite(n) && s !== "" ? String(n) : s;
}

/**
 * Co-op combat answer pipeline. Two atomic operations:
 *   1. Decrement monster HP + add attacker to `damagers` (query guards on
 *      `defeated: false` so no post-mortem damage is applied).
 *   2. Transition `defeated: false → true` in a second `findOneAndUpdate`
 *      which can only succeed ONCE globally per monster instance. The winner
 *      of that race is the only one that distributes kill rewards.
 *
 * Player HP/stat penalty for a wrong answer is applied directly (no shared
 * state to synchronize).
 */
export async function submitCombatAnswer({ userId, questionId, answer, roomCode }) {
  const q = await Question.findOne({ questionId }).select("+correctAnswer");
  if (!q) throw new NotFoundError("Question not found or expired");
  if (String(q.player) !== String(userId)) throw new GameStateError("Not your question");
  if (q.roomCode !== roomCode) throw new GameStateError("Question not for this room");
  if (q.used) throw new GameStateError("Already answered");
  if (q.expiresAt < new Date()) throw new GameStateError("Question expired");

  const isCorrect = normalise(q.correctAnswer) === normalise(answer);

  // Single-use claim
  const claimed = await Question.findOneAndUpdate(
    { _id: q._id, used: false },
    { $set: { used: true } },
    { new: true }
  );
  if (!claimed) throw new GameStateError("Already answered");

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");
  user.stats.totalQuestionsAnswered += 1;

  if (!isCorrect) {
    user.stats.incorrectAnswers += 1;
    const damage = 5 + q.difficulty * 2;
    user.health = Math.max(0, user.health - damage);
    await user.save();
    await eventBus.emitAsync(EVENTS.ANSWER_INCORRECT, { userId, questionId, damage });
    await eventBus.emitAsync(EVENTS.PLAYER_DAMAGED, { userId, damage });
    return { correct: false, playerDamage: damage, health: user.health };
  }

  user.stats.correctAnswers += 1;
  await user.save();

  const instanceId = q.monsterInstanceId;
  if (!instanceId) throw new GameStateError("Question not linked to a monster");

  // ---- Atomic damage + damager track (only while defeated === false) ----
  const afterHit = await GameRoom.findOneAndUpdate(
    { code: roomCode, monsters: { $elemMatch: { instanceId, defeated: false } } },
    {
      $inc: { "monsters.$[m].currentHp": -PLAYER_HIT_DAMAGE },
      $addToSet: { "monsters.$[m].damagers": new mongoose.Types.ObjectId(userId) },
    },
    { new: true, arrayFilters: [{ "m.instanceId": instanceId }] }
  );
  if (!afterHit) throw new GameStateError("Monster already defeated");

  let mon = afterHit.monsters.find((m) => m.instanceId === instanceId);

  // ---- Atomic defeat transition; only one request ever wins ----
  let defeatedNow = false;
  if (mon.currentHp <= 0 && !mon.defeated) {
    const claimedKill = await GameRoom.findOneAndUpdate(
      {
        code: roomCode,
        monsters: { $elemMatch: { instanceId, defeated: false, currentHp: { $lte: 0 } } },
      },
      { $set: { "monsters.$[m].defeated": true } },
      { new: true, arrayFilters: [{ "m.instanceId": instanceId }] }
    );
    if (claimedKill) {
      defeatedNow = true;
      const finalMon = claimedKill.monsters.find((m) => m.instanceId === instanceId);
      const damagers = [...(finalMon?.damagers || [])];

      // Reward every damager exactly once. Broadcast happens in socket layer.
      // TODO: Havent done "You killed the monsters" things
      for (const dUserId of damagers) {
        try {
          await eventBus.emitAsync(EVENTS.MONSTER_DEFEATED, {
            userId: dUserId,
            monsterId: finalMon.monsterId,
            xpReward: finalMon.xpReward,
            coinReward: finalMon.coinReward,
            drops: [],
          });
        } catch (err) {
          logger.error({ err, dUserId, instanceId }, "kill reward failed");
        }
      }
    } else {
      // Another request won the transition between our update and this one.
      const refreshed = await GameRoom.findOne({ code: roomCode }).lean();
      const fresh = refreshed?.monsters?.find((m) => m.instanceId === instanceId);
      if (fresh) mon = fresh;
    }
  }

  return {
    correct: true,
    damage: PLAYER_HIT_DAMAGE,
    monster: {
      instanceId,
      name: mon.name,
      currentHp: Math.max(0, mon.currentHp),
      maxHp: mon.maxHp,
      defeated: !!mon.defeated,
    },
    defeated: !!mon.defeated,
    defeatedNow,
  };
}
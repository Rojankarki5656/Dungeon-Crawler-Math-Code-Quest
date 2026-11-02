import { GameRoom } from "../models/GameRoom.js";
import { createQuestion } from "../services/answerService.js";
import { submitCombatAnswer } from "../services/combatService.js";
import { logger } from "../config/logger.js";

export function registerCombatHandlers(io, socket) {
  const userId = socket.user.id;

  socket.on("combat:start", async ({ monsterInstanceId, difficulty = 1 } = {}, ack) => {
    try {
      const code = socket.roomCode;
      if (!code) return ack?.({ ok: false, error: "Join a room first" });
      if (!monsterInstanceId) return ack?.({ ok: false, error: "monsterInstanceId required" });

      const room = await GameRoom.findOne({ code }).lean();
      if (!room) return ack?.({ ok: false, error: "Room not found" });
      const mon = room.monsters?.find((m) => m.instanceId === monsterInstanceId);
      if (!mon) return ack?.({ ok: false, error: "Monster not found" });
      if (mon.defeated) return ack?.({ ok: false, error: "Monster already defeated" });

      const effectiveDifficulty = Math.min(6, Math.max(difficulty, mon.difficulty || 1));

      const q = await createQuestion({
        userId,
        difficulty: effectiveDifficulty,
        monsterId: mon.monsterId,
        roomCode: code,
        monsterInstanceId,
      });

      ack?.({
        ok: true,
        data: {
          question: q,
          monster: {
            instanceId: mon.instanceId,
            name: mon.name,
            currentHp: mon.currentHp,
            maxHp: mon.maxHp,
            spriteKey: mon.spriteKey,
          },
        },
      });
    } catch (err) {
      logger.error({ err }, "combat:start failed");
      ack?.({ ok: false, error: "Could not start combat" });
    }
  });

  socket.on("combat:answer", async ({ questionId, answer } = {}, ack) => {
    try {
      const code = socket.roomCode;
      if (!code) return ack?.({ ok: false, error: "Join a room first" });
      if (!questionId) return ack?.({ ok: false, error: "questionId required" });

      const result = await submitCombatAnswer({ userId, questionId, answer, roomCode: code });
      ack?.({ ok: true, data: result });

      if (result.correct) {
        io.to(code).emit("monster:updated", {
          instanceId: result.monster.instanceId,
          currentHp: result.monster.currentHp,
          maxHp: result.monster.maxHp,
          defeated: result.monster.defeated,
          lastHitBy: userId,
          damage: result.damage,
        });
        if (result.defeatedNow) {
          io.to(code).emit("monster:defeated", {
            instanceId: result.monster.instanceId,
            name: result.monster.name,
          });
          io.to(code).emit("system:message", {
            message: `${socket.user.username} defeated ${result.monster.name}!`,
          });
        }
      } else {
        io.to(code).emit("player:damaged", {
          userId, health: result.health, damage: result.playerDamage,
        });
      }
    } catch (err) {
      logger.warn({ err: err.message, userId }, "combat:answer failed");
      ack?.({ ok: false, error: err.message || "answer failed" });
    }
  });
}
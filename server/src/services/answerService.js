import { nanoid } from "nanoid";
import { Question } from "../models/Question.js";
import { Monster } from "../models/Monster.js";
import { User } from "../models/User.js";
import { questionService } from "./questionService.js";
import { applyXp } from "./progressionService.js";
import { env } from "../config/env.js";
import { NotFoundError, GameStateError } from "../errors/index.js";
import { eventBus } from "../events/eventBus.js";
import { EVENTS } from "../events/eventTypes.js";

export async function createQuestion({ userId, difficulty = 1, monsterId, sessionId, roomCode, monsterInstanceId }) {
  const q = await questionService.generate({ difficulty });
  const questionId = nanoid(16);
  const imageData = `data:image/png;base64,${q.pngBuffer.toString("base64")}`;
  const expiresAt = new Date(Date.now() + env.questionTtlSeconds * 1000);

  await Question.create({
    questionId,
    player: userId,
    session: sessionId,
    monster: monsterId,
    roomCode,
    monsterInstanceId,
    imageMime: "image/png",
    imageData,
    correctAnswer: q.correctAnswer,
    difficulty: q.difficulty,
    provider: q.provider,
    expiresAt,
  });

  return { questionId, image: imageData, difficulty: q.difficulty, provider: q.provider, expiresAt };
}

export async function submitAnswer({ userId, questionId, answer }) {
  const q = await Question.findOne({ questionId }).select("+correctAnswer");
  if (!q) throw new NotFoundError("Question not found or expired");
  if (String(q.player) !== String(userId)) throw new GameStateError("Question belongs to another player");
  if (q.used) throw new GameStateError("Question already answered");
  if (q.expiresAt < new Date()) throw new GameStateError("Question expired");

  const isCorrect = normalise(q.correctAnswer) === normalise(answer);

  // Atomic claim: only ONE request per question can ever win this.
  const claimed = await Question.findOneAndUpdate(
    { _id: q._id, used: false },
    { $set: { used: true } },
    { new: true }
  );
  if (!claimed) throw new GameStateError("Question already answered");

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  user.stats.totalQuestionsAnswered += 1;

  if (isCorrect) {
    user.stats.correctAnswers += 1;

    let monster = null;
    if (q.monster) monster = await Monster.findById(q.monster);
    const xpGain = monster?.xpReward ?? 10 + q.difficulty * 2;
    const coinGain = monster?.coinReward ?? 2 + q.difficulty;

    user.coins += coinGain;
    const levelResult = await applyXp(user, xpGain);  // this emits PLAYER_LEVEL_UP internally
    await user.save();

    await eventBus.emitAsync(EVENTS.ANSWER_CORRECT, { userId, questionId, xpGain, coinGain }); // FIRE THE EVENT
    await eventBus.emitAsync(EVENTS.MONSTER_DAMAGED, {
      userId, monsterId: q.monster, damage: 25,
    });

    return {
      correct: true,
      xpGain,
      coinGain,
      leveledUp: levelResult.leveledUp,
      newLevel: levelResult.newLevel,
      user: user.toPublic(),
    };
  }

  user.stats.incorrectAnswers += 1;
  const damage = 5 + q.difficulty * 2;
  user.health = Math.max(0, user.health - damage);
  await user.save();

  await eventBus.emitAsync(EVENTS.ANSWER_INCORRECT, { userId, questionId, damage });
  await eventBus.emitAsync(EVENTS.PLAYER_DAMAGED, { userId, damage });

  return {
    correct: false,
    playerDamage: damage,
    user: user.toPublic(),
  };
}

function normalise(v) {
  const s = String(v).trim().toLowerCase();
  const n = Number(s);
  return Number.isFinite(n) && s !== "" ? String(n) : s;
}
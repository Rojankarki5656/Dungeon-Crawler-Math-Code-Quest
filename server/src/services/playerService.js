import { User } from "../models/User.js";
import { xpProgressForLevel } from "./progressionService.js";
import { NotFoundError } from "../errors/index.js";

export async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");
  const publicUser = user.toPublic();
  return { user: publicUser, progression: xpProgressForLevel(user) };
}

export async function getStats(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw new NotFoundError("User not found");
  const answered = user.stats.totalQuestionsAnswered;
  const correct = user.stats.correctAnswers;
  return {
    level: user.level,
    xp: user.xp,
    coins: user.coins,
    health: user.health,
    maxHealth: user.maxHealth,
    totalMonstersDefeated: user.stats.totalMonstersDefeated,
    totalQuestionsAnswered: answered,
    correctAnswers: correct,
    incorrectAnswers: user.stats.incorrectAnswers,
    accuracy: answered > 0 ? Math.round((correct / answered) * 1000) / 10 : 0,
    registeredAt: user.createdAt,
  };
}

const PROJ = {
  username: 1, avatar: 1, level: 1, xp: 1,
  "stats.totalMonstersDefeated": 1,
  "stats.totalQuestionsAnswered": 1,
  "stats.correctAnswers": 1,
};

export async function getLeaderboard({ by = "level", limit = 20 } = {}) {
  const n = Math.min(100, Math.max(1, Number(limit) || 20));
  if (by === "accuracy") {
    return User.aggregate([
      { $match: { isBanned: { $ne: true }, "stats.totalQuestionsAnswered": { $gt: 0 } } },
      {
        $addFields: {
          accuracy: { $divide: ["$stats.correctAnswers", "$stats.totalQuestionsAnswered"] },
        },
      },
      { $sort: { accuracy: -1, "stats.totalQuestionsAnswered": -1 } },
      { $limit: n },
      { $project: { ...PROJ, accuracy: 1 } },
    ]);
  }
  const sortMap = {
    level: { level: -1, xp: -1 },
    xp: { xp: -1 },
    monsters: { "stats.totalMonstersDefeated": -1 },
  };
  const sort = sortMap[by] || sortMap.level;
  return User.find({ isBanned: { $ne: true } }, PROJ).sort(sort).limit(n).lean();
}
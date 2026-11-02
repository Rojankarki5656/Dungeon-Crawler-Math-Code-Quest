import { Dungeon } from "../models/Dungeon.js";
import { Monster } from "../models/Monster.js";
import { User } from "../models/User.js";
import { NotFoundError, GameStateError } from "../errors/index.js";

export async function listDungeons(user) {
  const all = await Dungeon.find({ enabled: true }).sort({ levelRequirement: 1, difficulty: 1 });
  const unlockedIds = new Set((user.unlockedDungeons || []).map((id) => String(id)));
  return all.map((d) => ({
    ...d.toObject(),
    unlocked: unlockedIds.has(String(d._id)) || user.level >= d.levelRequirement,
    levelRequirementMet: user.level >= d.levelRequirement,
  }));
}

export async function getDungeon(id) {
  const d = await Dungeon.findById(id).populate("monsters");
  if (!d) throw new NotFoundError("Dungeon not found");
  return d;
}

export async function unlockDungeon(userId, dungeonId) {
  const dungeon = await Dungeon.findById(dungeonId);
  if (!dungeon || !dungeon.enabled) throw new NotFoundError("Dungeon not found");
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");
  if (user.level < dungeon.levelRequirement) {
    throw new GameStateError(`Requires level ${dungeon.levelRequirement}`);
  }
  const already = user.unlockedDungeons.some((id) => String(id) === String(dungeon._id));
  if (!already) {
    user.unlockedDungeons.push(dungeon._id);
    await user.save();
  }
  return { dungeonId: dungeon._id, unlocked: true };
}

/** Throws if the user is not eligible to enter this dungeon. */
export async function assertCanEnter(userId, dungeonId) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");
  const dungeon = await Dungeon.findById(dungeonId);
  if (!dungeon || !dungeon.enabled) throw new NotFoundError("Dungeon not found");
  if (user.level < dungeon.levelRequirement) {
    throw new GameStateError(`Requires level ${dungeon.levelRequirement}`);
  }
  return dungeon;
}

/** Pick a monster pool for a dungeon — used by Phase 3 spawner. */
export async function pickMonsterPool(dungeonId) {
  const d = await Dungeon.findById(dungeonId).populate("monsters");
  if (!d) throw new NotFoundError("Dungeon not found");
  return d.monsters || [];
}

export const Monster_ = Monster; // re-export for convenience in tests
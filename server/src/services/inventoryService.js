import { Inventory } from "../models/Inventory.js";
import { Item } from "../models/Item.js";
import { User } from "../models/User.js";
import { applyXp } from "./progressionService.js";
import { NotFoundError, GameStateError } from "../errors/index.js";

const MAX_STACK = 999;

export async function getInventory(userId) {
  const rows = await Inventory.find({ user: userId }).populate("item").lean();
  return rows
    .filter((r) => r.item && r.quantity > 0)
    .map((r) => ({ itemKey: r.item.key, item: r.item, quantity: r.quantity }));
}

export async function addItem(userId, itemKey, quantity = 1) {
  const item = await Item.findOne({ key: itemKey });
  if (!item) throw new NotFoundError(`Unknown item: ${itemKey}`);
  const inv = await Inventory.findOneAndUpdate(
    { user: userId, item: item._id },
    { $inc: { quantity: Math.max(1, quantity) } },
    { upsert: true, new: true }
  );
  if (inv.quantity > MAX_STACK) { inv.quantity = MAX_STACK; await inv.save(); }
  return { itemKey, quantity: inv.quantity };
}

/** Atomically consume one unit and apply the item effect. */
export async function useItem(userId, itemKey) {
  const item = await Item.findOne({ key: itemKey });
  if (!item) throw new NotFoundError("Item not found");
  if (item.type !== "CONSUMABLE") throw new GameStateError("Item is not consumable");
  if (item.effect.kind === "NONE") throw new GameStateError("Item has no effect");

  // Atomic decrement so two concurrent uses cannot race to zero.
  const inv = await Inventory.findOneAndUpdate(
    { user: userId, item: item._id, quantity: { $gte: 1 } },
    { $inc: { quantity: -1 } },
    { new: true }
  );
  if (!inv) throw new GameStateError("Not enough items");

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  const { kind, amount } = item.effect;
  const before = {
    health: user.health, maxHealth: user.maxHealth, xp: user.xp,
    coins: user.coins, level: user.level,
  };

  switch (kind) {
    case "HEAL": {
      user.health = Math.min(user.maxHealth, user.health + amount);
      await user.save();
      break;
    }
    case "MAX_HP": {
      user.maxHealth += amount;
      user.health = Math.min(user.maxHealth, user.health + amount);
      await user.save();
      break;
    }
    case "COINS": {
      user.coins += amount;
      await user.save();
      break;
    }
    case "XP": {
      const lvl = await applyXp(user, amount);
      await user.save();
      return { itemKey, user: user.toPublic(), leveledUp: lvl.leveledUp, newLevel: lvl.newLevel };
    }
    default:
      throw new GameStateError("Unsupported item effect");
  }

  return { itemKey, user: user.toPublic(), before };
}

/** Convenience: grant a bundle of item drops. Used on monster kill. */
export async function grantDrops(userId, drops = []) {
  const results = [];
  for (const d of drops) {
    results.push(await addItem(userId, d.itemKey, d.quantity || 1));
  }
  return results;
}
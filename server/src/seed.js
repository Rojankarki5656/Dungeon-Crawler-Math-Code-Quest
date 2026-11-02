import { connectDB, disconnectDB } from "./config/db.js";
import { logger } from "./config/logger.js";
import { env } from "./config/env.js";
import { Item } from "./models/Item.js";
import { Monster } from "./models/Monster.js";
import { Dungeon } from "./models/Dungeon.js";
import { User } from "./models/User.js";
import bcrypt from "bcrypt";

const ITEMS = [
  { key: "health_potion", name: "Health Potion", description: "Restores 25 HP.",
    type: "CONSUMABLE", rarity: "COMMON", effect: { kind: "HEAL", amount: 25 }, spriteKey: "potion_red", price: 10 },
  { key: "greater_potion", name: "Greater Potion", description: "Restores 60 HP.",
    type: "CONSUMABLE", rarity: "RARE", effect: { kind: "HEAL", amount: 60 }, spriteKey: "potion_blue", price: 30 },
  { key: "xp_scroll", name: "XP Scroll", description: "Grants 100 XP.",
    type: "CONSUMABLE", rarity: "RARE", effect: { kind: "XP", amount: 100 }, spriteKey: "scroll", price: 50 },
  { key: "coin_pouch", name: "Coin Pouch", description: "Grants 50 coins.",
    type: "CONSUMABLE", rarity: "COMMON", effect: { kind: "COINS", amount: 50 }, spriteKey: "pouch", price: 40 },
  { key: "heart_crystal", name: "Heart Crystal", description: "Permanently increases max HP by 20.",
    type: "CONSUMABLE", rarity: "EPIC", effect: { kind: "MAX_HP", amount: 20 }, spriteKey: "crystal", stackable: false, price: 200 },
  { key: "trophy_slime", name: "Slime Trophy", description: "Proof of your first kill.",
    type: "TROPHY", rarity: "COMMON", effect: { kind: "NONE", amount: 0 }, spriteKey: "trophy", stackable: true },
];

const MONSTERS = [
  { key: "slime", name: "Slime", maxHp: 30, damage: 5, xpReward: 15, coinReward: 5, difficulty: 1, spriteKey: "slime" },
  { key: "goblin", name: "Goblin", maxHp: 50, damage: 8, xpReward: 25, coinReward: 10, difficulty: 2, spriteKey: "goblin" },
  { key: "skeleton", name: "Skeleton", maxHp: 60, damage: 10, xpReward: 35, coinReward: 15, difficulty: 3, spriteKey: "skeleton" },
  { key: "dark_mage", name: "Dark Mage", maxHp: 80, damage: 15, xpReward: 60, coinReward: 25, difficulty: 4, spriteKey: "dark_mage" },
  { key: "dungeon_boss", name: "Dungeon Boss", maxHp: 200, damage: 25, xpReward: 200, coinReward: 100, difficulty: 6, spriteKey: "boss" },
];

const DUNGEONS = [
  { name: "Beginner Dungeon", slug: "beginner", description: "Where every adventurer starts.",
    levelRequirement: 1, difficulty: 1, theme: "stone", monsters: ["slime"] },
  { name: "Forest Dungeon", slug: "forest", description: "Ancient roots and lurking goblins.",
    levelRequirement: 2, difficulty: 2, theme: "forest", monsters: ["slime", "goblin"] },
  { name: "Skeleton Crypt", slug: "crypt", description: "Bones rattle in the dark.",
    levelRequirement: 3, difficulty: 3, theme: "crypt", monsters: ["skeleton", "goblin"] },
  { name: "Goblin Fortress", slug: "fortress", description: "The goblin king's stronghold.",
    levelRequirement: 4, difficulty: 4, theme: "fortress", monsters: ["goblin", "skeleton"] },
  { name: "Dark Castle", slug: "dark_castle", description: "Where the dark mages convene.",
    levelRequirement: 5, difficulty: 5, theme: "castle", monsters: ["dark_mage", "skeleton"] },
  { name: "Final Boss Dungeon", slug: "final", description: "Only legends enter here.",
    levelRequirement: 6, difficulty: 6, theme: "boss", monsters: ["dungeon_boss", "dark_mage"] },
];

async function run() {
  await connectDB();

  // Items
  for (const it of ITEMS) {
    await Item.updateOne({ key: it.key }, { $set: it }, { upsert: true });
  }
  logger.info(`items seeded: ${ITEMS.length}`);

  // Monsters
  for (const m of MONSTERS) {
    await Monster.updateOne({ key: m.key }, { $set: m }, { upsert: true });
  }
  logger.info(`monsters seeded: ${MONSTERS.length}`);

  // Dungeons (resolve monster keys → ids)
  for (const d of DUNGEONS) {
    const docs = await Monster.find({ key: { $in: d.monsters } });
    const monsterIds = docs.map((m) => m._id);
    await Dungeon.updateOne(
      { slug: d.slug },
      { $set: { ...d, monsters: monsterIds, enabled: true } },
      { upsert: true }
    );
  }
  logger.info(`dungeons seeded: ${DUNGEONS.length}`);

  // Admin account (env configurable, sensible defaults)
  const adminEmail = process.env.ADMIN_EMAIL || "admin@dungeonquest.local";
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await User.create({
      username: adminUsername,
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      level: 10, xp: 5000, coins: 1000,
      maxHealth: 200, health: 200,
    });
    logger.info(`admin created: ${adminEmail} (password from env ADMIN_PASSWORD or default)`);
  } else {
    logger.info("admin already exists, skipping");
  }

  // Give every existing player a starting health potion if none
  const { addItem } = await import("./services/inventoryService.js");
  const players = await User.find({ role: "PLAYER" });
  for (const p of players) {
    await addItem(p._id, "health_potion", 3).catch(() => {});
  }

  await disconnectDB();
  logger.info("seed complete");
}

run().catch((err) => { logger.error({ err }, "seed failed"); process.exit(1); });
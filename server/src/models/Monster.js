import mongoose from "mongoose";
const monsterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  key: { type: String, required: true, unique: true },
  maxHp: { type: Number, required: true, min: 1 },
  damage: { type: Number, default: 10 },
  xpReward: { type: Number, default: 10 },
  coinReward: { type: Number, default: 5 },
  difficulty: { type: Number, default: 1 },
  spriteKey: { type: String, default: "slime" },
}, { timestamps: true });
export const Monster = mongoose.model("Monster", monsterSchema);
import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true }, // e.g. "health_potion"
  name: { type: String, required: true },
  description: { type: String, default: "" },
  type: { type: String, enum: ["CONSUMABLE", "TROPHY", "KEY"], default: "CONSUMABLE" },
  rarity: { type: String, enum: ["COMMON", "RARE", "EPIC", "LEGENDARY"], default: "COMMON" },
  effect: {
    kind: { type: String, enum: ["HEAL", "XP", "COINS", "MAX_HP", "NONE"], default: "NONE" },
    amount: { type: Number, default: 0, min: 0 },
  },
  spriteKey: { type: String, default: "potion" },
  stackable: { type: Boolean, default: true },
  price: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

itemSchema.methods.toPublic = function () {
  const o = this.toObject();
  delete o.__v;
  return o;
};

export const Item = mongoose.model("Item", itemSchema);
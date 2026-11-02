import mongoose from "mongoose";
const dungeonSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  levelRequirement: { type: Number, default: 1 },
  difficulty: { type: Number, default: 1 },
  theme: { type: String, default: "stone" },
  monsters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Monster" }],
  enabled: { type: Boolean, default: true },
}, { timestamps: true });
export const Dungeon = mongoose.model("Dungeon", dungeonSchema);
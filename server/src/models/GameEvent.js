import mongoose from "mongoose";
const geSchema = new mongoose.Schema({
  type: { type: String, required: true, index: true },
  player: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: "GameRoom" },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });
geSchema.index({ createdAt: -1 });
export const GameEvent = mongoose.model("GameEvent", geSchema);
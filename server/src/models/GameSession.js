import mongoose from "mongoose";
const gameSessionSchema = new mongoose.Schema({
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  dungeon: { type: mongoose.Schema.Types.ObjectId, ref: "Dungeon" },
  room: { type: mongoose.Schema.Types.ObjectId, ref: "GameRoom" },
  status: { type: String, enum: ["ACTIVE", "COMPLETED", "ABANDONED"], default: "ACTIVE" },
  progress: { monstersDefeated: { type: Number, default: 0 } },
  startTime: { type: Date, default: Date.now },
  endTime: Date,
}, { timestamps: true });
export const GameSession = mongoose.model("GameSession", gameSessionSchema);
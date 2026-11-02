import mongoose from "mongoose";

const playerSlot = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  health: { type: Number, default: 100 },
  level: { type: Number, default: 1 },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const monsterInstance = new mongoose.Schema({
  instanceId: { type: String, required: true },
  monsterId: { type: mongoose.Schema.Types.ObjectId, ref: "Monster", required: true },
  name: { type: String, required: true },
  maxHp: { type: Number, required: true },
  currentHp: { type: Number, required: true },
  damage: { type: Number, default: 5 },
  xpReward: { type: Number, default: 10 },
  coinReward: { type: Number, default: 5 },
  difficulty: { type: Number, default: 1 },
  spriteKey: { type: String, default: "slime" },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  defeated: { type: Boolean, default: false },
  damagers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { _id: false });

const gameRoomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dungeon: { type: mongoose.Schema.Types.ObjectId, ref: "Dungeon" },
  players: [playerSlot],
  monsters: [monsterInstance],
  status: { type: String, enum: ["WAITING", "ACTIVE", "FINISHED"], default: "WAITING" },
  isPrivate: { type: Boolean, default: false },
  soloMode: { type: Boolean, default: false, index: true },
  pausedAt: { type: Date, default: null },
}, { timestamps: true });

export const GameRoom = mongoose.model("GameRoom", gameRoomSchema);
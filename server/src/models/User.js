import mongoose from "mongoose";

const statsSchema = new mongoose.Schema({
  totalMonstersDefeated: { type: Number, default: 0 },
  totalQuestionsAnswered: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  incorrectAnswers: { type: Number, default: 0 },
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 24 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["PLAYER", "ADMIN"], default: "PLAYER" },
  avatar: { type: String, default: "knight" },
  level: { type: Number, default: 1, min: 1 },
  xp: { type: Number, default: 0, min: 0 },
  coins: { type: Number, default: 0, min: 0 },
  health: { type: Number, default: 100, min: 0 },
  maxHealth: { type: Number, default: 100, min: 1 },
  stats: { type: statsSchema, default: () => ({}) },
  unlockedDungeons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Dungeon" }],
  isBanned: { type: Boolean, default: false },
  lastLogin: Date,
}, { timestamps: true });

userSchema.index({ level: -1, xp: -1 });
userSchema.index({ "stats.totalMonstersDefeated": -1 });

userSchema.methods.toPublic = function () {
  const o = this.toObject();
  delete o.passwordHash; delete o.__v;
  return o;
};

export const User = mongoose.model("User", userSchema);
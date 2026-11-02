import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionId: { type: String, required: true, unique: true, index: true },
  player: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: "GameSession", index: true },
  monster: { type: mongoose.Schema.Types.ObjectId, ref: "Monster" },
  roomCode: { type: String, index: true },        // null for solo
  monsterInstanceId: { type: String },            // null for solo
  imageMime: { type: String, required: true },
  imageData: { type: String, required: true }, // base64 or data-url
  correctAnswer: { type: String, required: true, select: false },
  difficulty: { type: Number, default: 1 },
  provider: { type: String, enum: ["teacher", "local"], required: true },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL
}, { timestamps: true });

questionSchema.index({ player: 1, used: 1, expiresAt: 1 });

export const Question = mongoose.model("Question", questionSchema);
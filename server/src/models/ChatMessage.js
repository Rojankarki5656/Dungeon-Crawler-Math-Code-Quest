import mongoose from "mongoose";
const chatSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: "GameRoom", index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: String,
  message: { type: String, required: true, maxlength: 300 },
}, { timestamps: true });
chatSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });
export const ChatMessage = mongoose.model("ChatMessage", chatSchema);
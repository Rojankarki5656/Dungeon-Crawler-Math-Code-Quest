import { GameRoom } from "../models/GameRoom.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { eventBus } from "../events/eventBus.js";
import { EVENTS } from "../events/eventTypes.js";

const MAX_LEN = 300;
const WINDOW_MS = 10_000;
const MAX_PER_WINDOW = 5;

export function registerChatHandlers(io, socket, limits) {
  const userId = socket.user.id;

  socket.on("chat:message", async ({ message } = {}, ack) => {
    try {
      const code = socket.roomCode;
      if (!code) return ack?.({ ok: false, error: "Join a room first" });
      if (typeof message !== "string") return ack?.({ ok: false, error: "Invalid message" });
      const text = message.trim().slice(0, MAX_LEN);
      if (!text) return ack?.({ ok: false, error: "Empty message" });

      // Simple sliding-window rate limit (per socket.user)
      const now = Date.now();
      const bucket = limits.get(userId) || { count: 0, resetAt: now + WINDOW_MS };
      if (now > bucket.resetAt) { bucket.count = 0; bucket.resetAt = now + WINDOW_MS; }
      if (bucket.count >= MAX_PER_WINDOW) {
        return ack?.({ ok: false, error: "Slow down" });
      }
      bucket.count += 1;
      limits.set(userId, bucket);

      const room = await GameRoom.findOne({ code }).select("_id").lean();
      if (!room) return ack?.({ ok: false, error: "Room not found" });

      const doc = await ChatMessage.create({
        room: room._id,
        sender: userId,
        username: socket.user.username,
        message: text,
      });

      const payload = {
        id: String(doc._id),
        userId,
        username: socket.user.username,
        avatar: socket.user.avatar,
        message: text,
        timestamp: doc.createdAt,
      };
      io.to(code).emit("chat:message", payload);
      await eventBus.emitAsync(EVENTS.CHAT_MESSAGE_SENT, { userId, roomCode: code });
      ack?.({ ok: true, data: payload });
    } catch {
      ack?.({ ok: false, error: "chat failed" });
    }
  });
}
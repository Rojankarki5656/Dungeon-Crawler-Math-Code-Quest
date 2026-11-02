import { GameRoom } from "../models/GameRoom.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { User } from "../models/User.js"; // explicit — ensures populate target is registered
import { logger } from "../config/logger.js";

/** Room position store: code -> Map<userId, {x, y}>. In-memory broadcast only. */
export const positions = new Map();

export function registerRoomHandlers(io, socket) {
  const userId = String(socket.user.id);

  socket.on("room:join", async ({ code } = {}, ack) => {
    try {
      if (!code) return ack?.({ ok: false, error: "code required" });
      const upper = String(code).toUpperCase();

      // --- 1) Membership check against the RAW room (mirrors REST join) ---
      const rawRoom = await GameRoom.findOne({ code: upper }).lean();
      if (!rawRoom) return ack?.({ ok: false, error: "Room not found" });

      const isOwner = String(rawRoom.owner) === userId;
      const isMember =
        isOwner ||
        rawRoom.players.some((p) => {
          // p.user may be: populated doc ({_id, ...}), raw ObjectId, or null
          const id = p.user?._id ?? p.user;
          return id != null && String(id) === userId;
        });

      if (!isMember) {
        logger.warn(
          {
            code: upper,
            userId,
            ownerId: String(rawRoom.owner),
            playerIds: rawRoom.players.map((p) => {
              const id = p.user?._id ?? p.user;
              return id != null ? String(id) : null;
            }),
          },
          "room:join membership check failed",
        );
        return ack?.({ ok: false, error: "Not a member of this room" });
      }

      // --- 2) Now fetch the populated version for the client response ---
      const room = await GameRoom.findById(rawRoom._id)
        .populate("players.user", "username avatar level health maxHealth")
        .populate("dungeon", "name slug difficulty")
        .lean();

      socket.join(upper);
      socket.roomCode = upper;

      if (!positions.has(upper)) positions.set(upper, new Map());
      if (!positions.get(upper).has(userId))
        positions.get(upper).set(userId, { x: 0, y: 0 });

      socket.to(upper).emit("player:joined", {
        user: socket.user,
        position: positions.get(upper).get(userId),
      });

      const history = await ChatMessage.find({ room: rawRoom._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      ack?.({
        ok: true,
        data: {
          room,
          positions: Object.fromEntries(positions.get(upper)),
          chat: history.reverse(),
        },
      });
    } catch (err) {
      logger.error({ err }, "room:join failed");
      ack?.({ ok: false, error: "join failed" });
    }
  });

  socket.on("room:leave", async (_payload, ack) => {
    const code = socket.roomCode;
    if (code) {
      socket.leave(code);
      positions.get(code)?.delete(userId);
      if (positions.get(code)?.size === 0) positions.delete(code);
      io.to(code).emit("player:left", { userId });
      socket.roomCode = null;
    }
    ack?.({ ok: true });
  });

  socket.on("disconnect", () => {
    const code = socket.roomCode;
    if (code) {
      positions.get(code)?.delete(userId);
      if (positions.get(code)?.size === 0) positions.delete(code);
      io.to(code).emit("player:left", { userId });
    }
  });
}

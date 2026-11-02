import { positions } from "./roomHandlers.js";

export function registerMovementHandlers(_io, socket) {
  const userId = socket.user.id;

  socket.on("player:move", ({ x, y } = {}) => {
    const code = socket.roomCode;
    if (!code) return;
    if (typeof x !== "number" || typeof y !== "number") return;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    // Sanity clamp — trust no client-provided number without bounds
    const cx = Math.max(-10000, Math.min(10000, x));
    const cy = Math.max(-10000, Math.min(10000, y));
    if (!positions.has(code)) positions.set(code, new Map());
    positions.get(code).set(userId, { x: cx, y: cy });
    socket.to(code).emit("player:moved", { userId, x: cx, y: cy });
  });
}   
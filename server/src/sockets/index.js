import { Server } from "socket.io";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { socketAuth } from "./auth.js";
import { registerRoomHandlers } from "./roomHandlers.js";
import { registerMovementHandlers } from "./movementHandlers.js";
import { registerChatHandlers } from "./chatHandlers.js";
import { registerCombatHandlers } from "./combatHandlers.js";

/** Chat rate limits keyed by userId. In-memory, per-process. */
const chatLimits = new Map();

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    logger.debug({ userId: socket.user.id }, "socket connected");
    registerRoomHandlers(io, socket);
    registerMovementHandlers(io, socket);
    registerChatHandlers(io, socket, chatLimits);
    registerCombatHandlers(io, socket);
    socket.on("disconnect", (reason) => {
      logger.debug({ userId: socket.user?.id, reason }, "socket disconnected");
    });
  });

  return io;
}
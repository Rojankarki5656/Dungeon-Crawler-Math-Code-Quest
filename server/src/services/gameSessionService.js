import { GameSession } from "../models/GameSession.js";
import { NotFoundError, AuthorizationError } from "../errors/index.js";

export async function getSessionForUser(sessionId, user) {
  const session = await GameSession.findById(sessionId)
    .populate("players", "username avatar level health maxHealth")
    .populate("dungeon", "name slug difficulty")
    .lean();
  if (!session) throw new NotFoundError("Session not found");
  const allowed =
    user.role === "ADMIN" ||
    session.players.some((p) => String(p._id) === String(user._id));
  if (!allowed) throw new AuthorizationError();
  return session;
}
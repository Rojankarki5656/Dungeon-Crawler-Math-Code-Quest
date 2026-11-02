import { env } from "../config/env.js";
import { verifyToken } from "../services/authService.js";
import { User } from "../models/User.js";

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export async function socketAuth(socket, next) {
  try {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const token = cookies[env.cookieName];
    if (!token) return next(new Error("Authentication required"));
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).lean();
    if (!user || user.isBanned) return next(new Error("Account not available"));
    socket.user = {
      id: String(user._id),
      username: user.username,
      avatar: user.avatar,
      level: user.level,
      role: user.role,
    };
    socket.roomCode = null;
    next();
  } catch {
    next(new Error("Invalid session"));
  }
}
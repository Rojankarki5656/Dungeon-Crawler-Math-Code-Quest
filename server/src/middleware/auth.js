import { AuthenticationError, AuthorizationError } from "../errors/index.js";
import { env } from "../config/env.js";
import { verifyToken } from "../services/authService.js";
import { User } from "../models/User.js";

export async function requireAuth(req, _res, next) {
  try {
    const token = req.cookies?.[env.cookieName];
    if (!token) throw new AuthenticationError("No session");
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user || user.isBanned) throw new AuthenticationError("Account not available");
    req.user = user;
    next();
  } catch (e) { next(e); }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AuthorizationError());
    }
    next();
  };
}
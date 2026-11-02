import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { AuthenticationError, ValidationError } from "../errors/index.js";
import { eventBus } from "../events/eventBus.js";
import { EVENTS } from "../events/eventTypes.js";

const SALT_ROUNDS = 12;

export async function registerUser({ username, email, password }) {
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) throw new ValidationError("Username or email already in use");
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ username, email, passwordHash });
  await eventBus.emitAsync(EVENTS.USER_REGISTERED, { userId: user._id });
  return user;
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) throw new AuthenticationError("Invalid credentials");
  if (user.isBanned) throw new AuthenticationError("Account suspended");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AuthenticationError("Invalid credentials");
  user.lastLogin = new Date();
  await user.save();
  await eventBus.emitAsync(EVENTS.USER_LOGGED_IN, { userId: user._id });
  return user;
}

export function issueToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AuthenticationError("Invalid or expired token");
  }
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}
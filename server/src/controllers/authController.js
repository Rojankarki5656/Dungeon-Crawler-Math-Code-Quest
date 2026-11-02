import { asyncHandler } from "../utils/asyncHandler.js";
import { registerUser, loginUser, issueToken, cookieOptions } from "../services/authService.js";
import { env } from "../config/env.js";

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);
  const token = issueToken(user);
  res.cookie(env.cookieName, token, cookieOptions());
  res.status(201).json({ success: true, data: { user: user.toPublic() } });
});

export const login = asyncHandler(async (req, res) => {
  const user = await loginUser(req.body);
  const token = issueToken(user);
  res.cookie(env.cookieName, token, cookieOptions());
  res.json({ success: true, data: { user: user.toPublic() } });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(env.cookieName, { ...cookieOptions(), maxAge: 0 });
  res.json({ success: true });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toPublic() } });
});
import { Router } from "express";
import { register, login, logout, me } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators/schemas.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";

const r = Router();
r.post("/register", authLimiter, validate(registerSchema), register);
r.post("/login", authLimiter, validate(loginSchema), login);
r.post("/logout", logout);
r.get("/me", requireAuth, me);
export default r;
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { leaderboardQuerySchema } from "../validators/schemas.js";
import { profile, stats, leaderboard } from "../controllers/playerController.js";

const r = Router();
r.use(requireAuth);
r.get("/profile", profile);
r.get("/stats", stats);
r.get("/leaderboard", validate(leaderboardQuerySchema, "query"), leaderboard);
export default r;
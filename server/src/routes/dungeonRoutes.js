import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { list, detail, unlock } from "../controllers/dungeonController.js";

const r = Router();
r.use(requireAuth);
r.get("/", list);
r.get("/:id", detail);
r.post("/:id/unlock", unlock);
export default r;
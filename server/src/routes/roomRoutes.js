import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createRoomSchema } from "../validators/schemas.js";
import { create, join, leave, detail, open } from "../controllers/roomController.js";

const r = Router();
r.use(requireAuth);
r.get("/", open);                       // list open public rooms
r.post("/", validate(createRoomSchema), create);
r.get("/:code", detail);
r.post("/:code/join", join);
r.post("/:code/leave", leave);
export default r;
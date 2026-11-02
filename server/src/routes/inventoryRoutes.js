import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { useItemSchema } from "../validators/schemas.js";
import { list, use } from "../controllers/inventoryController.js";

const r = Router();
r.use(requireAuth);
r.get("/", list);
r.post("/use", validate(useItemSchema), use);
export default r;
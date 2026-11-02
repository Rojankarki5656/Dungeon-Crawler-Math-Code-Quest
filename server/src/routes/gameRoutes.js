import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { requestQuestionSchema, submitAnswerSchema } from "../validators/schemas.js";
import { requestQuestion, answerQuestion, getSession } from "../controllers/gameController.js";
import { apiLimiter } from "../middleware/rateLimit.js";

const r = Router();
r.use(requireAuth, apiLimiter);
r.post("/questions", validate(requestQuestionSchema), requestQuestion);
r.post("/answers", validate(submitAnswerSchema), answerQuestion);
r.get("/sessions/:id", getSession);
export default r;
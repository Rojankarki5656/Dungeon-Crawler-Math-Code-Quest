import { asyncHandler } from "../utils/asyncHandler.js";
import { createQuestion, submitAnswer } from "../services/answerService.js";
import { getSessionForUser } from "../services/gameSessionService.js";

export const requestQuestion = asyncHandler(async (req, res) => {
  const q = await createQuestion({
    userId: req.user._id,
    difficulty: req.body.difficulty ?? 1,
    monsterId: req.body.monsterId,
    sessionId: req.body.sessionId,
    roomCode: req.body.roomCode,
    monsterInstanceId: req.body.monsterInstanceId,
  });
  res.json({ success: true, data: q });
});

export const answerQuestion = asyncHandler(async (req, res) => {
  const result = await submitAnswer({
    userId: req.user._id,
    questionId: req.body.questionId,
    answer: req.body.answer,
  });
  res.json({ success: true, data: result });
});

export const getSession = asyncHandler(async (req, res) => {
  const data = await getSessionForUser(req.params.id, req.user);
  res.json({ success: true, data });
});
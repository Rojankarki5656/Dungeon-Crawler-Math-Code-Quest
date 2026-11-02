import { asyncHandler } from "../utils/asyncHandler.js";
import { getProfile, getStats, getLeaderboard } from "../services/playerService.js";

export const profile = asyncHandler(async (req, res) => {
  const data = await getProfile(req.user._id);
  res.json({ success: true, data });
});

export const stats = asyncHandler(async (req, res) => {
  const data = await getStats(req.user._id);
  res.json({ success: true, data });
});

export const leaderboard = asyncHandler(async (req, res) => {
  const data = await getLeaderboard({
    by: req.query.by,
    limit: req.query.limit,
  });
  res.json({ success: true, data });
});
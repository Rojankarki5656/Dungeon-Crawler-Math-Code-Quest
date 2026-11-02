import { asyncHandler } from "../utils/asyncHandler.js";
import { listDungeons, getDungeon, unlockDungeon } from "../services/dungeonService.js";

export const list = asyncHandler(async (req, res) => {
  const data = await listDungeons(req.user);
  res.json({ success: true, data });
});

export const detail = asyncHandler(async (req, res) => {
  const data = await getDungeon(req.params.id);
  res.json({ success: true, data });
});

export const unlock = asyncHandler(async (req, res) => {
  const data = await unlockDungeon(req.user._id, req.params.id);
  res.json({ success: true, data });
});
import { asyncHandler } from "../utils/asyncHandler.js";
import { getInventory, useItem } from "../services/inventoryService.js";

export const list = asyncHandler(async (req, res) => {
  const data = await getInventory(req.user._id);
  res.json({ success: true, data });
});

export const use = asyncHandler(async (req, res) => {
  const data = await useItem(req.user._id, req.body.itemKey);
  res.json({ success: true, data });
});
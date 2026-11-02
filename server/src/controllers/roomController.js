import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createRoom, joinRoom, leaveRoom, getRoomByCode, listOpenRooms,
} from "../services/roomService.js";

export const create = asyncHandler(async (req, res) => {
  const room = await createRoom(req.user._id, req.body);
  res.status(201).json({ success: true, data: room });
});

export const join = asyncHandler(async (req, res) => {
  const room = await joinRoom(req.user._id, req.params.code);
  res.json({ success: true, data: room });
});

export const leave = asyncHandler(async (req, res) => {
  const data = await leaveRoom(req.user._id, req.params.code);
  res.json({ success: true, data });
});

export const detail = asyncHandler(async (req, res) => {
  const data = await getRoomByCode(req.params.code);
  res.json({ success: true, data });
});

export const open = asyncHandler(async (_req, res) => {
  const data = await listOpenRooms();
  res.json({ success: true, data });
});
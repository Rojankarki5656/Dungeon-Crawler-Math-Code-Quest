import { Router } from "express";
import authRoutes from "./authRoutes.js";
import gameRoutes from "./gameRoutes.js";
import playerRoutes from "./playerRoutes.js";
import dungeonRoutes from "./dungeonRoutes.js";
import inventoryRoutes from "./inventoryRoutes.js";
import roomRoutes from "./roomRoutes.js";

const r = Router();
r.use("/auth", authRoutes);
r.use("/game", gameRoutes);
r.use("/game/rooms", roomRoutes);
r.use("/players", playerRoutes);
r.use("/dungeons", dungeonRoutes);
r.use("/inventory", inventoryRoutes);
export default r;
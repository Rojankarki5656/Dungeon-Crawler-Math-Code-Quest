import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

export async function connectDB() {
  mongoose.connection.on("error", (e) => logger.error({ err: e }, "mongo error"));
  mongoose.connection.on("disconnected", () => logger.warn("mongo disconnected"));
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  logger.info("MongoDB connected");
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
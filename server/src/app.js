import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

// Register event listeners once at boot
import "./events/handlers/authHandler.js";
import "./events/handlers/combatHandler.js";
import "./events/handlers/rewardHandler.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  app.get("/api/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));
  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
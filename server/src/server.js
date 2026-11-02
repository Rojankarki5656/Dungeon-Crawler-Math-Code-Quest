import http from "node:http";
import { createApp } from "./app.js";
import { createSocketServer } from "./sockets/index.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

async function bootstrap() {
  await connectDB();
  const app = createApp();
  const server = http.createServer(app);
  const io = createSocketServer(server);
  app.set("io", io);

  server.listen(env.port, () => logger.info(`Server listening on :${env.port}`));

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down`);
    io.close();
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("unhandledRejection", (err) => logger.error({ err }, "unhandledRejection"));
  process.on("uncaughtException", (err) => {
    logger.error({ err }, "uncaughtException");
    shutdown("uncaughtException");
  });
}

bootstrap().catch((err) => { logger.error({ err }, "bootstrap failed"); process.exit(1); });
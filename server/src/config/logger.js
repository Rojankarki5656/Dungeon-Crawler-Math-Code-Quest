import { createRequire } from "node:module";
import pino from "pino";
import { env } from "./env.js";

const require = createRequire(import.meta.url);

// In dev, try to enable pino-pretty. If it isn't installed (fresh clone,
// `npm install --omit=dev`, CI image, etc.) we silently fall back to plain
// JSON logs — never crash the process over a log formatter.
function prettyTransport() {
  if (env.isProd) return undefined;
  try {
    require.resolve("pino-pretty");
    return {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:HH:MM:ss.l",
        ignore: "pid,hostname",
      },
    };
  } catch {
    return undefined; // pino-pretty not installed — use default JSON output
  }
}

export const logger = pino({
  level: env.isProd ? "info" : "debug",
  transport: prettyTransport(),
});
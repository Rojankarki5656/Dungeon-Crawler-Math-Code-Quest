import dotenv from "dotenv";
dotenv.config();

const bool = (v, def = false) => (v === undefined ? def : ["1","true","yes"].includes(String(v).toLowerCase()));

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/dungeonquest",

  jwtSecret: process.env.JWT_SECRET || "dev-insecure-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  cookieName: process.env.COOKIE_NAME || "dq_token",
  cookieSecure: bool(process.env.COOKIE_SECURE, false),

  teacherApi: {
    url: process.env.TEACHER_API_URL || "",
    key: process.env.TEACHER_API_KEY || "",
    timeout: Number(process.env.TEACHER_API_TIMEOUT || 5000),
    enabled: bool(process.env.TEACHER_API_ENABLED, false),
  },

  questionTtlSeconds: Number(process.env.QUESTION_TTL_SECONDS || 300),
  circuitBreaker: {
    failureThreshold: Number(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || 3),
    cooldownMs: Number(process.env.CIRCUIT_BREAKER_COOLDOWN_MS || 60000),
  },
};

if (env.isProd && env.jwtSecret === "dev-insecure-secret") {
  throw new Error("JWT_SECRET must be set in production");
}
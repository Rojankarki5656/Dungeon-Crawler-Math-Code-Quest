import { ZodError } from "zod";
import { AppError } from "../errors/index.js";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";

export function notFound(req, res, next) {
  next(new AppError(`Route ${req.originalUrl} not found`, 404, "NOT_FOUND"));
}

export function errorHandler(err, req, res, _next) {
  let status = err.statusCode || 500;
  let code = err.code || "INTERNAL_ERROR";
  let message = err.message || "Internal error";
  let details = err.details;

  if (err instanceof ZodError) {
    status = 400; code = "VALIDATION_ERROR"; message = "Validation failed";
    details = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
  }
  if (err.name === "CastError") { status = 400; code = "INVALID_ID"; message = "Invalid identifier"; }
  if (err.name === "TokenExpiredError") { status = 401; code = "TOKEN_EXPIRED"; message = "Session expired"; }

  logger[status >= 500 ? "error" : "warn"]({ err, path: req.originalUrl }, message);

  res.status(status).json({
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
    ...(env.isProd ? {} : { stack: err.stack }),
  });
}
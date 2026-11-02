/**
 * Base class for all expected application errors.
 * `isOperational = true` tells the central error handler that
 * this error is safe to surface to the client (vs. an unexpected crash).
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR", details) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }
}
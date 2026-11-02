import { AppError } from "./AppError.js";

export { AppError };

export class ValidationError extends AppError {
  constructor(msg = "Validation failed", details) { super(msg, 400, "VALIDATION_ERROR", details); }
}
export class AuthenticationError extends AppError {
  constructor(msg = "Authentication required") { super(msg, 401, "AUTHENTICATION_ERROR"); }
}
export class AuthorizationError extends AppError {
  constructor(msg = "Forbidden") { super(msg, 403, "AUTHORIZATION_ERROR"); }
}
export class NotFoundError extends AppError {
  constructor(msg = "Not found") { super(msg, 404, "NOT_FOUND"); }
}
export class ExternalAPIError extends AppError {
  constructor(msg = "External API failed", details) { super(msg, 502, "EXTERNAL_API_ERROR", details); }
}
export class DatabaseError extends AppError {
  constructor(msg = "Database error") { super(msg, 500, "DATABASE_ERROR"); }
}
export class GameStateError extends AppError {
  constructor(msg = "Invalid game state") { super(msg, 409, "GAME_STATE_ERROR"); }
}
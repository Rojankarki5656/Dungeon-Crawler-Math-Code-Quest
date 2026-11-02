import { ValidationError } from "../errors/index.js";

export const validate = (schema, source = "body") => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(new ValidationError("Validation failed",
      result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))));
  }
  req[source] = result.data;
  next();
};
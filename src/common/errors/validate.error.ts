import { AppError } from "./app-error";

export class ValidationError extends AppError {
  constructor(
    message = "Validation failed",
    code = "VALIDATION_ERROR",
    details?: unknown,
  ) {
    super(message, 400, JSON.stringify({ code, details }));
  }
}

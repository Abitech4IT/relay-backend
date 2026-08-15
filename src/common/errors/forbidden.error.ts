import { AppError } from "./app-error";

export class ForbiddenError extends AppError {
  constructor(
    message = "You do not have permission to perform this action",
    code = "FORBIDDEN",
  ) {
    super(message, 403, code);
  }
}

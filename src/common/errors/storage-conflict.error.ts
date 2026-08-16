import { AppError } from "./app-error";

export class StorageConflictError extends AppError {
  constructor(message = "Generated storage key already exists") {
    super(message, 409, "STORAGE_KEY_CONFLICT");
  }
}

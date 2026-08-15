import { BadRequestError } from "../errors";

const MAX_IDEMPOTENCY_KEY_LENGTH = 255;

export function getIdempotencyKey(value: string | undefined): string {
  if (!value) {
    throw new BadRequestError(
      "Idempotency-Key header is required",
      "IDEMPOTENCY_KEY_REQUIRED",
    );
  }

  const key = value.trim();

  if (!key) {
    throw new BadRequestError(
      "Idempotency-Key header is required",
      "IDEMPOTENCY_KEY_REQUIRED",
    );
  }

  if (key.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
    throw new BadRequestError(
      "Idempotency-Key is too long",
      "INVALID_IDEMPOTENCY_KEY",
    );
  }

  return key;
}

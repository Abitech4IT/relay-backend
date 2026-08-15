import { randomBytes } from "crypto";

export function generateRequestPublicId(): string {
  const randomPart = randomBytes(10).toString("hex").toUpperCase();

  return `REQ_${randomPart}`;
}

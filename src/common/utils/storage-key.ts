import { randomUUID } from "crypto";

export function generateAttachmentStorageKey(extension: string): string {
  const now = new Date();

  const year = now.getUTCFullYear();

  const month = String(now.getUTCMonth() + 1).padStart(2, "0");

  return [
    "attachments",
    String(year),
    month,
    `${randomUUID()}${extension}`,
  ].join("/");
}

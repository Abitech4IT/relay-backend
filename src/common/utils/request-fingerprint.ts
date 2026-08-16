import { createHash } from "crypto";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const object = value as Record<string, unknown>;

  const keys = Object.keys(object).sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(object[key])}`)
    .join(",")}}`;
}

export function generateRequestFingerprint(input: unknown): string {
  return createHash("sha256").update(stableStringify(input)).digest("hex");
}

import path from "path";

export function sanitizeFilename(filename: string): string {
  const baseName = path.basename(filename);

  return baseName
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 200);
}

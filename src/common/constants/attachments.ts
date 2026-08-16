export const ALLOWED_ATTACHMENT_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],

  "image/png": [".png"],

  "image/webp": [".webp"],

  "application/pdf": [".pdf"],
} as const;

export type AllowedAttachmentMimeType = keyof typeof ALLOWED_ATTACHMENT_TYPES;

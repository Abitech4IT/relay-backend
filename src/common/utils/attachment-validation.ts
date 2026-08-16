import path from "path";

import { BadRequestError } from "../errors";

import {
  ALLOWED_ATTACHMENT_TYPES,
  AllowedAttachmentMimeType,
} from "../constants/attachments";

export interface ValidatedAttachment {
  extension: string;
  mimeType: AllowedAttachmentMimeType;
}

type AttachmentUploadFile = {
  originalname: string;
  size: number;
  mimetype: string;
};

export function validateAttachment(
  file: AttachmentUploadFile,
  maxSizeBytes: number,
): ValidatedAttachment {
  if (!file.originalname) {
    throw new BadRequestError(
      "Attachment filename is required",
      "INVALID_ATTACHMENT_FILENAME",
    );
  }

  if (file.size <= 0) {
    throw new BadRequestError("Attachment is empty", "EMPTY_ATTACHMENT");
  }

  if (file.size > maxSizeBytes) {
    throw new BadRequestError(
      "Attachment exceeds the maximum allowed size",
      "ATTACHMENT_TOO_LARGE",
    );
  }

  const mimeType = file.mimetype as AllowedAttachmentMimeType;

  const allowedExtensions = ALLOWED_ATTACHMENT_TYPES[mimeType];

  if (!allowedExtensions) {
    throw new BadRequestError(
      "Unsupported attachment type",
      "UNSUPPORTED_ATTACHMENT_TYPE",
    );
  }

  const extension = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(extension as never)) {
    throw new BadRequestError(
      "Attachment extension does not match its MIME type",
      "ATTACHMENT_TYPE_MISMATCH",
    );
  }

  return {
    extension,
    mimeType,
  };
}

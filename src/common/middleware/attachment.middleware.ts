import multer from "multer";

import { env } from "../../config/env";

const maxSizeBytes = env.UPLOAD_MAX_SIZE_MB * 1024 * 1024;

export const attachmentUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: maxSizeBytes,

    files: 5,
  },
});

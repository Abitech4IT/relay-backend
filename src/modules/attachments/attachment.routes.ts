import { Router } from "express";

import { authenticate } from "../../common/middleware/auth.middleware";

import { asyncHandler } from "../../common/utils/async-handler";

import { AttachmentController } from "./attachment.controller";

import { attachmentService } from "./attachment.module";
import { attachmentUpload } from "../../common/middleware/attachment.middleware";

const router = Router();

const attachmentController = new AttachmentController(attachmentService);

router.post(
  "/requests/:publicId/attachments",
  authenticate,
  attachmentUpload.array("attachments", 5),
  asyncHandler(attachmentController.upload),
);

router.get(
  "/requests/:publicId/attachments",
  authenticate,
  asyncHandler(attachmentController.getForRequest),
);

export default router;

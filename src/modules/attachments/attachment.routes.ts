import { Router } from "express";

import { authenticate } from "../../common/middleware/auth.middleware";
import { asyncHandler } from "../../common/utils/async-handler";

import { AttachmentController } from "./attachment.controller";
import { attachmentService } from "./attachment.module";
import { attachmentUpload } from "../../common/middleware/attachment.middleware";

const router = Router();

const attachmentController = new AttachmentController(attachmentService);

/**
 * @openapi
 * /api/requests/{publicId}/attachments:
 *   post:
 *     tags:
 *       - Attachments
 *     summary: Upload request attachments
 *     description: |
 *       Uploads one or more attachments to a service request.
 *
 *       The authenticated user must own the request.
 *
 *       Supported file types:
 *       - JPEG
 *       - PNG
 *       - WebP
 *       - PDF
 *
 *       A maximum of 5 files may be submitted in one request.
 *       File metadata is returned without exposing internal storage paths.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PublicRequestId'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - attachments
 *             properties:
 *               attachments:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Attachments uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     attachments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Attachment'
 *       400:
 *         description: |
 *           Invalid attachment request. Possible cases include:
 *           - no file supplied
 *           - unsupported MIME type
 *           - extension mismatch
 *           - file too large
 *           - too many attachments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/RequestNotFound'
 */
router.post(
  "/requests/:publicId/attachments",
  authenticate,
  attachmentUpload.array("attachments", 5),
  asyncHandler(attachmentController.upload),
);

/**
 * @openapi
 * /api/requests/{publicId}/attachments:
 *   get:
 *     tags:
 *       - Attachments
 *     summary: List request attachment metadata
 *     description: |
 *       Returns attachment metadata for a request owned by the authenticated user.
 *
 *       Internal storage keys, stored filenames and filesystem paths are not exposed.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PublicRequestId'
 *     responses:
 *       200:
 *         description: Request attachments.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     attachments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Attachment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/RequestNotFound'
 */
router.get(
  "/requests/:publicId/attachments",
  authenticate,
  asyncHandler(attachmentController.getForRequest),
);

export default router;

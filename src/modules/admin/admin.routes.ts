import { Router } from "express";

import { authenticate } from "../../common/middleware/auth.middleware";
import { requireRole } from "../../common/middleware/role.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";

import { UserRole } from "../../common/constants/roles";

import { adminCorrectionSchema } from "./admin.schemas";
import { adminController } from "./admin.module";

const router = Router();

router.use(authenticate, requireRole(UserRole.ADMIN));

/**
 * @openapi
 * /api/admin/requests/{publicId}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Review a service request
 *     description: |
 *       Returns a service request regardless of its owner.
 *
 *       ADMIN role is required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PublicRequestId'
 *     responses:
 *       200:
 *         description: Administrative request view.
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
 *                     request:
 *                       $ref: '#/components/schemas/AdminRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/RequestNotFound'
 */
router.get("/requests/:publicId", asyncHandler(adminController.getRequest));

/**
 * @openapi
 * /api/admin/requests/{publicId}/provider-results:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get provider execution results
 *     description: |
 *       Returns provider execution metadata for the selected request.
 *
 *       Raw provider payloads and authentication secrets are not returned.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PublicRequestId'
 *     responses:
 *       200:
 *         description: Provider execution results.
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
 *                     providerResults:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProviderResult'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/RequestNotFound'
 */
router.get(
  "/requests/:publicId/provider-results",
  asyncHandler(adminController.getProviderResults),
);

/**
 * @openapi
 * /api/admin/requests/{publicId}:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Correct a request
 *     description: |
 *       Allows an administrator to correct a limited set of request fields.
 *
 *       Correctable fields:
 *       - category
 *       - customerProfile
 *       - asset
 *       - notes
 *
 *       Fields such as userId, publicId, idempotencyKey and timestamps
 *       cannot be modified through this endpoint.
 *
 *       Every successful correction creates an immutable audit record
 *       containing the actor, old value, new value, timestamp and reason.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PublicRequestId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminCorrection'
 *           examples:
 *             categoryCorrection:
 *               summary: Correct request category
 *               value:
 *                 field: category
 *                 value: vehicle-premium-service
 *                 reason: Corrected after manual verification
 *             notesCorrection:
 *               summary: Correct request notes
 *               value:
 *                 field: notes
 *                 value: Customer confirmed morning fulfillment
 *                 reason: Updated following customer confirmation
 *     responses:
 *       200:
 *         description: Request corrected successfully.
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
 *                     request:
 *                       $ref: '#/components/schemas/ServiceRequest'
 *       400:
 *         description: Invalid correction, protected field or unchanged value.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/RequestNotFound'
 */
router.patch(
  "/requests/:publicId",
  validate(adminCorrectionSchema),
  asyncHandler(adminController.correctRequest),
);

/**
 * @openapi
 * /api/admin/requests/{publicId}/audit-logs:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get request audit trail
 *     description: |
 *       Returns immutable administrative correction records for a request.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PublicRequestId'
 *     responses:
 *       200:
 *         description: Request audit trail.
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
 *                     auditLogs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AuditLog'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/RequestNotFound'
 */
router.get(
  "/requests/:publicId/audit-logs",
  asyncHandler(adminController.getAuditTrail),
);

export default router;

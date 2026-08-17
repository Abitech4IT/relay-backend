import { Router } from "express";

import { authenticate } from "../../common/middleware/auth.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";

import { createServiceRequestSchema } from "./request.schemas";
import { requestController } from "./request-controller.module";
import { requestCreationRateLimiter } from "../../common/middleware/rate-limit.middleware";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/requests:
 *   post:
 *     tags:
 *       - Requests
 *     summary: Create a service request
 *     description: |
 *       Creates a new service request owned by the authenticated user.
 *
 *       Request creation is idempotent. The caller must provide an
 *       Idempotency-Key header.
 *
 *       - First submission returns 201.
 *       - Replay with the same key and payload returns 200.
 *       - Reusing the same key with a different payload returns 409.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdempotencyKey'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateServiceRequest'
 *     responses:
 *       201:
 *         description: Service request created.
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
 *                     idempotentReplay:
 *                       type: boolean
 *                       example: false
 *       200:
 *         description: Existing request returned after an idempotent replay.
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
 *                     idempotentReplay:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Validation failed or Idempotency-Key is missing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         description: The Idempotency-Key has already been used with a different payload.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Request creation rate limit exceeded.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  requestCreationRateLimiter,
  validate(createServiceRequestSchema),
  asyncHandler(requestController.create),
);

/**
 * @openapi
 * /api/requests:
 *   get:
 *     tags:
 *       - Requests
 *     summary: Get request history
 *     description: Returns only requests owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User request history.
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
 *                     requests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ServiceRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", asyncHandler(requestController.getHistory));

/**
 * @openapi
 * /api/requests/{publicId}/offers:
 *   get:
 *     tags:
 *       - Requests
 *     summary: Get normalized and ranked offers
 *     description: |
 *       Returns the normalized offers collected for a service request.
 *
 *       Offers are ordered by their persisted ranking.
 *
 *       The authenticated user must own the request. A request belonging
 *       to another user is returned as 404 to prevent object-level
 *       authorization leakage.
 *
 *       An empty offers array is returned when the request exists but
 *       provider processing has not yet produced any successful offers.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PublicRequestId'
 *     responses:
 *       200:
 *         description: Normalized and ranked request offers.
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
 *                     requestId:
 *                       type: string
 *                       example: REQ_A5533AA06CB57CA542ED
 *                     status:
 *                       type: string
 *                       enum:
 *                         - CREATED
 *                         - PROCESSING
 *                         - PARTIAL_RESULTS
 *                         - READY_FOR_REVIEW
 *                         - COMPLETED
 *                         - FAILED
 *                     offers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Offer'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/RequestNotFound'
 */
router.get("/:publicId/offers", asyncHandler(requestController.getOffers));

/**
 * @openapi
 * /api/requests/{publicId}:
 *   get:
 *     tags:
 *       - Requests
 *     summary: Get one service request
 *     description: |
 *       Returns a request only if it belongs to the authenticated user.
 *
 *       Requests belonging to another user are returned as 404 to avoid
 *       exposing resource existence.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PublicRequestId'
 *     responses:
 *       200:
 *         description: Service request.
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/RequestNotFound'
 */
router.get("/:publicId", asyncHandler(requestController.getOne));

export default router;

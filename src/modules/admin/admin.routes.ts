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

router.get("/requests/:publicId", asyncHandler(adminController.getRequest));

router.get(
  "/requests/:publicId/provider-results",
  asyncHandler(adminController.getProviderResults),
);

router.patch(
  "/requests/:publicId",
  validate(adminCorrectionSchema),
  asyncHandler(adminController.correctRequest),
);

router.get(
  "/requests/:publicId/audit-logs",
  asyncHandler(adminController.getAuditTrail),
);

export default router;

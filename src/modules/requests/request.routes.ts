import { Router } from "express";

import { authenticate } from "../../common/middleware/auth.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";

import { createServiceRequestSchema } from "./request.schemas";
import { requestController } from "./request.module";
import { requestCreationRateLimiter } from "../../common/middleware/rate-limit.middleware";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  requestCreationRateLimiter,
  validate(createServiceRequestSchema),
  asyncHandler(requestController.create),
);

router.get("/", asyncHandler(requestController.getHistory));

router.get("/:publicId", asyncHandler(requestController.getOne));

export default router;

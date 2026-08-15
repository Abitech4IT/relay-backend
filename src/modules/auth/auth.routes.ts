import { Router } from "express";

import { asyncHandler } from "../../common/utils/async-handler";
import { validate } from "../../common/middleware/validate.middleware";

import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "./auth.schemas";

import { authController } from "./auth.module";
import { authRateLimiter } from "../../common/middleware/rate-limit.middleware";
import { authenticate } from "../../common/middleware";

const router = Router();

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler((req, res) => authController.register(req, res)),
);

router.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  asyncHandler((req, res) => authController.login(req, res)),
);

router.post(
  "/refresh",
  validate(refreshTokenSchema),
  asyncHandler((req, res) => authController.refresh(req, res)),
);

router.get(
  "/me",
  authenticate,
  asyncHandler((req, res) => authController.me(req, res)),
);

router.post(
  "/logout",
  validate(refreshTokenSchema),
  asyncHandler((req, res) => authController.logout(req, res)),
);

export default router;

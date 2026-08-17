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

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: |
 *       Creates a new Relay USER account.
 *
 *       Public registration does not allow the caller to choose the ADMIN role.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: A user with the supplied email already exists.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/register",
  validate(registerSchema),
  asyncHandler((req, res) => authController.register(req, res)),
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login
 *     description: |
 *       Authenticates a user and returns an access token and refresh token.
 *
 *       Rate limiting is applied to this endpoint.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Authentication successful.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials or account is disabled.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many authentication attempts.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  asyncHandler((req, res) => authController.login(req, res)),
);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Rotate refresh token
 *     description: |
 *       Exchanges a valid refresh token for a new access token and refresh token.
 *
 *       Refresh tokens are rotated. Reuse of an already-rotated/revoked refresh
 *       token is rejected.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Refresh token rotated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Refresh token is invalid, expired, revoked or belongs to a disabled account.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/refresh",
  validate(refreshTokenSchema),
  asyncHandler((req, res) => authController.refresh(req, res)),
);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current authenticated user.
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  "/me",
  authenticate,
  asyncHandler((req, res) => authController.me(req, res)),
);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout
 *     description: Revokes the supplied refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       204:
 *         description: Refresh token revoked successfully.
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Refresh token is invalid or already unusable.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/logout",
  validate(refreshTokenSchema),
  asyncHandler((req, res) => authController.logout(req, res)),
);

export default router;

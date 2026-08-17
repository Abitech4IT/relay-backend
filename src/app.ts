import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

import { errorHandler } from "./common/middleware/error-handler";

import { swaggerSpec } from "./config/swagger";

import authRoutes from "./modules/auth/auth.routes";
import requestRoutes from "./modules/requests/request.routes";
import attachmentRoutes from "./modules/attachments/attachment.routes";
import adminRoutes from "./modules/admin/admin.routes";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "*",

    credentials: true,
  }),
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Relay API is running.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Relay API is running
 */
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Relay API is running",
  });
});

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
  }),
);

app.use("/api/auth", authRoutes);

app.use("/api/requests", requestRoutes);

app.use("/api", attachmentRoutes);

app.use("/api/admin", adminRoutes);

app.use(errorHandler);

export default app;

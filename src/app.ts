import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./common/middleware/error-handler";

import { authenticate } from "./common/middleware/auth.middleware";
import { requireRole } from "./common/middleware/role.middleware";
import { UserRole } from "./common/constants/roles";

import authRoutes from "./modules/auth/auth.routes";
import requestRoutes from "./modules/requests/request.routes";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Relay API is running",
  });
});

app.get(
  "/api/admin/test",
  authenticate,
  requireRole(UserRole.ADMIN),
  (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin access granted",
    });
  },
);

app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);

app.use(errorHandler);

export default app;

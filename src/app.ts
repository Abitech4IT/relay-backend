import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./common/middleware/error-handler";

import authRoutes from "./modules/auth/auth.routes";

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
app.use("/api/auth", authRoutes);

app.use(errorHandler);

export default app;

import "reflect-metadata";

import { createServer } from "http";

import app from "./app";

import { AppDataSource } from "./config/database";

import { env } from "./config/env";

import { initializeRealtime } from "./modules/realtime/realtime.gateway";

const httpServer = createServer(app);

async function bootstrap() {
  try {
    await AppDataSource.initialize();

    console.log("Database connected successfully");

    initializeRealtime(httpServer);

    httpServer.listen(env.PORT, () => {
      console.log(`Relay API running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Application startup failed:", error);

    process.exit(1);
  }
}

void bootstrap();

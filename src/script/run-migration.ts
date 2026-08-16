import "reflect-metadata";

import { AppDataSource } from "../config/database";

async function runMigrations(): Promise<void> {
  try {
    await AppDataSource.initialize();

    console.log("Database connection established");

    const migrations = await AppDataSource.runMigrations();

    if (migrations.length === 0) {
      console.log("No pending migrations");
    } else {
      console.log(`Applied ${migrations.length} migration(s)`);
    }
  } catch (error) {
    console.error("Migration failed:", error);

    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

void runMigrations();

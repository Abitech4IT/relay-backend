import "reflect-metadata";
import dotenv from "dotenv";

dotenv.config();

import { AppDataSource } from "../../config/database";
import { User } from "../../modules/users/user.entity";

import { seedAdmin } from "./admin.seed";

async function runSeeds(): Promise<void> {
  try {
    console.log("Initializing database...");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log("Database connected.");

    const adminEmail = process.env.ADMIN_SEED_EMAIL;
    const adminPassword = process.env.ADMIN_SEED_PASSWORD;
    const adminFullName =
      process.env.ADMIN_SEED_FULL_NAME ?? "Relay Administrator";

    if (!adminEmail) {
      throw new Error("ADMIN_SEED_EMAIL environment variable is required");
    }

    if (!adminPassword) {
      throw new Error("ADMIN_SEED_PASSWORD environment variable is required");
    }

    if (adminPassword.length < 12) {
      throw new Error(
        "ADMIN_SEED_PASSWORD must be at least 12 characters long",
      );
    }

    const userRepository = AppDataSource.getRepository(User);

    await seedAdmin(userRepository, {
      email: adminEmail,
      fullName: adminFullName,
      password: adminPassword,
    });

    console.log("Database seeding completed successfully.");
  } catch (error) {
    console.error("Database seeding failed:", error);

    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

void runSeeds();

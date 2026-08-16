import "reflect-metadata";

import bcrypt from "bcrypt";

import { AppDataSource } from "../config/database";
import { User } from "../modules/users/user.entity";
import { UserRole } from "../common/constants/roles";

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL ?? "admin@relay.local";

  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";

  const fullName = process.env.ADMIN_FULL_NAME ?? "Relay Admin";

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository(User);

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await userRepository.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      if (existingUser.role === UserRole.ADMIN) {
        console.log(`Admin already exists: ${normalizedEmail}`);

        return;
      }

      existingUser.role = UserRole.ADMIN;

      existingUser.isActive = true;

      await userRepository.save(existingUser);

      console.log(`Existing user promoted to ADMIN: ${normalizedEmail}`);

      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = userRepository.create({
      email: normalizedEmail,

      fullName,

      passwordHash,

      role: UserRole.ADMIN,

      isActive: true,
    });

    const savedAdmin = await userRepository.save(admin);

    console.log("Admin created successfully");

    console.log({
      id: savedAdmin.id,

      email: savedAdmin.email,

      role: savedAdmin.role,
    });
  } catch (error) {
    console.error("Failed to create admin:", error);

    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

void createAdmin();

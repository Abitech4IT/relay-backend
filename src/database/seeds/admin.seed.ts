import bcrypt from "bcrypt";
import { Repository } from "typeorm";

import { User } from "../../modules/users/user.entity";
import { UserRole } from "../../common/constants/roles";

export interface AdminSeedOptions {
  email: string;
  fullName: string;
  password: string;
}

export async function seedAdmin(
  userRepository: Repository<User>,
  options: AdminSeedOptions,
): Promise<void> {
  const email = options.email.trim().toLowerCase();

  const existingUser = await userRepository.findOne({
    where: {
      email,
    },
  });

  if (existingUser) {
    if (existingUser.role === UserRole.ADMIN) {
      console.log(`Admin already exists: ${email}`);
      return;
    }

    throw new Error(
      `Cannot seed admin: a non-admin user already exists with email ${email}`,
    );
  }

  const passwordHash = await bcrypt.hash(options.password, 12);

  const admin = userRepository.create({
    email,

    fullName: options.fullName.trim(),

    passwordHash,

    role: UserRole.ADMIN,

    isActive: true,
  });

  await userRepository.save(admin);

  console.log(`Admin created successfully: ${admin.email}`);
}

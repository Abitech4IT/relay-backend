import { ConflictError, UnauthorizedError } from "../../common/errors";
import { UserRole } from "../../common/constants/roles";
import { userService } from "../users/user.module";
import { RefreshTokenService } from "./refresh-token.service";

import { LoginInput, RegisterInput } from "./auth.types";
import { hashPassword, verifyPassword } from "../../common/utils/password";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../common/utils/jwt";

import { env } from "../../config/env";

import { getExpirationDate } from "../../common/utils/token-expiration";
import { verifyRefreshToken } from "../../common/utils/jwt";

export class AuthService {
  constructor(private readonly refreshTokenService: RefreshTokenService) {}
  async register(input: RegisterInput) {
    const existingUser = await userService.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictError(
        "An account with this email already exists",
        "EMAIL_ALREADY_REGISTERED",
      );
    }

    const passwordHash = await hashPassword(input.password);

    const user = await userService.create({
      email: input.email,
      fullName: input.fullName,
      passwordHash,
      role: UserRole.USER,
      isActive: true,
    });

    const accessToken = generateAccessToken(user.id, user.role);

    const { token: refreshToken, tokenId } = generateRefreshToken(user.id);

    const expiresAt = getExpirationDate(env.REFRESH_TOKEN_EXPIRES_IN);

    await this.refreshTokenService.create(user.id, refreshToken, expiresAt);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(input: LoginInput) {
    const user = await userService.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedError(
        "Invalid email or password",
        "INVALID_CREDENTIALS",
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedError("Account is disabled", "ACCOUNT_DISABLED");
    }

    const passwordMatches = await verifyPassword(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedError(
        "Invalid email or password",
        "INVALID_CREDENTIALS",
      );
    }

    const accessToken = generateAccessToken(user.id, user.role);

    const { token: refreshToken } = generateRefreshToken(user.id);

    const expiresAt = getExpirationDate(env.REFRESH_TOKEN_EXPIRES_IN);

    await this.refreshTokenService.create(user.id, refreshToken, expiresAt);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    let payload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError(
        "Invalid refresh token",
        "INVALID_REFRESH_TOKEN",
      );
    }

    if (payload.type !== "refresh") {
      throw new UnauthorizedError(
        "Invalid refresh token",
        "INVALID_REFRESH_TOKEN",
      );
    }

    const rotated = await this.refreshTokenService.rotate(refreshToken);

    const accessToken = generateAccessToken(rotated.user.id, rotated.user.role);

    return {
      user: {
        id: rotated.user.id,
        email: rotated.user.email,
        fullName: rotated.user.fullName,
        role: rotated.user.role,
      },

      accessToken,

      refreshToken: rotated.token,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    let payload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      // Logout should be idempotent.
      return;
    }

    if (payload.type !== "refresh") {
      return;
    }

    const storedToken =
      await this.refreshTokenService.findByToken(refreshToken);

    if (!storedToken || storedToken.revokedAt) {
      return;
    }

    await this.refreshTokenService.revoke(storedToken);
  }
}

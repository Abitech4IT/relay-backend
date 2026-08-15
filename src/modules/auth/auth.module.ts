import { AppDataSource } from "../../config/database";

import { RefreshToken } from "./refresh-token.entity";
import { RefreshTokenService } from "./refresh-token.service";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

export const refreshTokenService = new RefreshTokenService(
  refreshTokenRepository,
);

export const authService = new AuthService(refreshTokenService);

export const authController = new AuthController(authService);

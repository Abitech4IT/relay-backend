import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
import { randomUUID } from "crypto";

import { env } from "../../config/env";
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from "../../modules/auth/auth.types";
import { UserRole } from "../constants/roles";

export function generateAccessToken(userId: string, role: UserRole): string {
  const payload: AccessTokenPayload = {
    sub: userId,
    role,
    type: "access",
  };

  const options: SignOptions = {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function generateRefreshToken(userId: string): {
  token: string;
  tokenId: string;
} {
  const tokenId = randomUUID();

  const payload: RefreshTokenPayload = {
    sub: userId,
    jti: tokenId,
    type: "refresh",
  };

  const options: SignOptions = {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
  };

  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, options);

  return {
    token,
    tokenId,
  };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const options: VerifyOptions = {
    algorithms: ["HS256"],
  };

  return jwt.verify(
    token,
    env.JWT_ACCESS_SECRET,
    options,
  ) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const options: VerifyOptions = {
    algorithms: ["HS256"],
  };

  return jwt.verify(
    token,
    env.JWT_REFRESH_SECRET,
    options,
  ) as RefreshTokenPayload;
}

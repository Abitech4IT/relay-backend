import { Repository } from "typeorm";

import { AppDataSource } from "../../config/database";
import { env } from "../../config/env";
import { UnauthorizedError } from "../../common/errors";
import { hashToken } from "../../common/utils/token-hash";
import { getExpirationDate } from "../../common/utils/token-expiration";
import { generateRefreshToken } from "../../common/utils/jwt";

import { RefreshToken } from "./refresh-token.entity";
import { User } from "../users/user.entity";

export interface RotatedRefreshToken {
  token: string;
  record: RefreshToken;
  user: User;
}

export class RefreshTokenService {
  constructor(
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async create(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    const tokenHash = hashToken(token);

    const refreshToken = this.refreshTokenRepository.create({
      tokenHash,
      expiresAt,
      user: {
        id: userId,
      },
    });

    return this.refreshTokenRepository.save(refreshToken);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const tokenHash = hashToken(token);

    return this.refreshTokenRepository.findOne({
      where: {
        tokenHash,
      },
      relations: {
        user: true,
      },
    });
  }

  isExpired(token: RefreshToken): boolean {
    return token.expiresAt.getTime() <= Date.now();
  }

  async revoke(
    token: RefreshToken,
    replacedByTokenId?: string,
  ): Promise<RefreshToken> {
    token.revokedAt = new Date();

    if (replacedByTokenId) {
      token.replacedByTokenId = replacedByTokenId;
    }

    return this.refreshTokenRepository.save(token);
  }

  async rotate(currentRawToken: string): Promise<RotatedRefreshToken> {
    return AppDataSource.transaction(async (manager) => {
      const repository = manager.getRepository(RefreshToken);

      const tokenHash = hashToken(currentRawToken);

      const currentToken = await repository
        .createQueryBuilder("refresh_token")
        .innerJoinAndSelect("refresh_token.user", "user")
        .where("refresh_token.tokenHash = :tokenHash", {
          tokenHash,
        })
        .setLock("pessimistic_write", undefined, ["refresh_token"])
        .getOne();

      if (!currentToken) {
        throw new UnauthorizedError(
          "Invalid refresh token",
          "INVALID_REFRESH_TOKEN",
        );
      }

      if (currentToken.revokedAt) {
        throw new UnauthorizedError(
          "Refresh token has already been revoked",
          "REFRESH_TOKEN_REVOKED",
        );
      }

      if (this.isExpired(currentToken)) {
        throw new UnauthorizedError(
          "Refresh token has expired",
          "REFRESH_TOKEN_EXPIRED",
        );
      }

      if (!currentToken.user.isActive) {
        throw new UnauthorizedError("Account is disabled", "ACCOUNT_DISABLED");
      }

      const { token: newRefreshToken } = generateRefreshToken(
        currentToken.user.id,
      );

      const replacement = repository.create({
        tokenHash: hashToken(newRefreshToken),

        expiresAt: getExpirationDate(env.REFRESH_TOKEN_EXPIRES_IN),

        user: currentToken.user,
      });

      const savedReplacement = await repository.save(replacement);

      currentToken.revokedAt = new Date();

      currentToken.replacedByTokenId = savedReplacement.id;

      await repository.save(currentToken);

      return {
        token: newRefreshToken,
        record: savedReplacement,
        user: currentToken.user,
      };
    });
  }
}

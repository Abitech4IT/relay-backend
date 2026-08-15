import { RequestHandler } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

import { UnauthorizedError } from "../errors";
import { verifyAccessToken } from "../utils/jwt";

import { userService } from "../../modules/users/user.module";

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedError(
        "Authentication required",
        "AUTHENTICATION_REQUIRED",
      );
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedError(
        "Invalid authorization header",
        "INVALID_AUTHORIZATION_HEADER",
      );
    }

    const payload = verifyAccessToken(token);

    if (payload.type !== "access") {
      throw new UnauthorizedError(
        "Invalid access token",
        "INVALID_ACCESS_TOKEN",
      );
    }

    const user = await userService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedError(
        "User account no longer exists",
        "USER_NOT_FOUND",
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedError("Account is disabled", "ACCOUNT_DISABLED");
    }

    req.user = {
      id: user.id,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      next(
        new UnauthorizedError(
          "Access token has expired",
          "ACCESS_TOKEN_EXPIRED",
        ),
      );

      return;
    }

    if (error instanceof JsonWebTokenError) {
      next(
        new UnauthorizedError("Invalid access token", "INVALID_ACCESS_TOKEN"),
      );

      return;
    }

    next(error);
  }
};

import { RequestHandler } from "express";

import { ForbiddenError } from "../errors";
import { UserRole } from "../constants/roles";

export const requireRole = (...allowedRoles: UserRole[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      next(
        new ForbiddenError(
          "Authenticated user context is missing",
          "AUTHENTICATION_CONTEXT_MISSING",
        ),
      );

      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          "You do not have permission to perform this action",
          "INSUFFICIENT_PERMISSIONS",
        ),
      );

      return;
    }

    next();
  };
};

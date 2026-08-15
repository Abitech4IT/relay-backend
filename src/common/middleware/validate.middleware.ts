import { RequestHandler } from "express";
import { ZodType } from "zod";

import { ValidationError } from "../errors";

export const validate = (schema: ZodType): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(
        new ValidationError(
          "Invalid request body",
          "VALIDATION_ERROR",
          result.error.issues,
        ),
      );

      return;
    }

    req.body = result.data;

    next();
  };
};

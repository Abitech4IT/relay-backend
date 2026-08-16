import rateLimit from "express-rate-limit";

import { env } from "../../config/env";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: env.NODE_ENV === "test" ? 1000 : 20,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many authentication attempts. Please try again later.",
    },
  },
});

export const requestCreationRateLimiter = rateLimit({
  windowMs: 60 * 1000,

  limit: env.NODE_ENV === "test" ? 1000 : 10,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    error: {
      code: "REQUEST_RATE_LIMITED",
      message: "Too many service requests. Please try again shortly.",
    },
  },
});

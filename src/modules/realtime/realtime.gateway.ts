import { Server as HttpServer } from "http";

import { Server, Socket } from "socket.io";

import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

import { env } from "../../config/env";

import { verifyAccessToken } from "../../common/utils/jwt";

import { userService } from "../users/user.module";

import { requestService } from "../requests/request.module";

import { RealtimeUser, SubscribeRequestPayload } from "./realtime.types";

let io: Server | null = null;

interface AuthenticatedSocket extends Socket {
  data: {
    user?: RealtimeUser;
  };
}

export function initializeRealtime(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN.split(","),
      credentials: true,
    },
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token || typeof token !== "string") {
        return next(new Error("AUTHENTICATION_REQUIRED"));
      }

      const payload = verifyAccessToken(token);

      const user = await userService.findById(payload.sub);

      if (!user) {
        return next(new Error("USER_NOT_FOUND"));
      }

      if (!user.isActive) {
        return next(new Error("ACCOUNT_DISABLED"));
      }

      socket.data.user = {
        id: user.id,
        role: user.role,
      };

      next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return next(new Error("ACCESS_TOKEN_EXPIRED"));
      }

      if (error instanceof JsonWebTokenError) {
        return next(new Error("INVALID_ACCESS_TOKEN"));
      }

      next(new Error("SOCKET_AUTHENTICATION_FAILED"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    socket.on(
      "request:subscribe",
      async (payload: SubscribeRequestPayload, callback?) => {
        try {
          const user = socket.data.user;

          if (!user) {
            throw new Error("AUTHENTICATION_REQUIRED");
          }

          const request = await requestService.findOwnedByPublicId(
            payload.requestId,
            user.id,
          );

          const room = getRequestRoom(request.publicId);

          await socket.join(room);

          callback?.({
            success: true,
            requestId: request.publicId,
          });
        } catch {
          callback?.({
            success: false,
            error: "REQUEST_NOT_FOUND",
          });
        }
      },
    );

    socket.on(
      "request:unsubscribe",
      async (payload: SubscribeRequestPayload) => {
        await socket.leave(getRequestRoom(payload.requestId));
      },
    );
  });

  return io;
}

export function getRealtimeServer(): Server {
  if (!io) {
    throw new Error("Realtime server has not been initialized");
  }

  return io;
}

export function getRequestRoom(publicRequestId: string): string {
  return `request:${publicRequestId}`;
}

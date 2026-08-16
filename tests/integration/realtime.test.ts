import { AddressInfo } from "net";
import { createServer, Server as HttpServer } from "http";
import { io as createClient, Socket } from "socket.io-client";
import request from "supertest";

import app from "../../src/app";
import { AppDataSource } from "../../src/config/database";

import { initializeRealtime } from "../../src/modules/realtime/realtime.gateway";

import { User } from "../../src/modules/users/user.entity";
import { RequestStatus } from "../../src/common/constants/request-status";
import { RealtimeService } from "../../src/modules/realtime/realtime.service";

describe("RealtimeService", () => {
  it("should not throw when realtime publishing fails", () => {
    const service = new RealtimeService();

    jest.spyOn(service, "emitRequestStatus").mockImplementation(() => {
      throw new Error("Socket unavailable");
    });

    expect(() =>
      service.safeEmitRequestStatus("REQ_TEST", RequestStatus.PROCESSING),
    ).not.toThrow();
  });
});

describe("Realtime", () => {
  let httpServer: HttpServer;
  let serverUrl: string;

  let userAId: string;
  let userBId: string;

  let userAToken: string;
  let userBToken: string;

  let requestPublicId: string;

  const userA = {
    email: `realtime-a-${Date.now()}@example.com`,
    fullName: "Realtime User A",
    password: "StrongPassword123!",
  };

  const userB = {
    email: `realtime-b-${Date.now()}@example.com`,
    fullName: "Realtime User B",
    password: "StrongPassword123!",
  };

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    httpServer = createServer(app);

    initializeRealtime(httpServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, "127.0.0.1", () => {
        resolve();
      });
    });

    const address = httpServer.address() as AddressInfo;

    serverUrl = `http://127.0.0.1:${address.port}`;

    const userAResponse = await request(app)
      .post("/api/auth/register")
      .send(userA);

    expect(userAResponse.status).toBe(201);

    userAId = userAResponse.body.data.user.id;

    userAToken = userAResponse.body.data.accessToken;

    const userBResponse = await request(app)
      .post("/api/auth/register")
      .send(userB);

    expect(userBResponse.status).toBe(201);

    userBId = userBResponse.body.data.user.id;

    userBToken = userBResponse.body.data.accessToken;

    const requestResponse = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${userAToken}`)
      .set("Idempotency-Key", `realtime-request-${Date.now()}`)
      .send({
        category: "vehicle-service",

        customerProfile: {
          firstName: "Jane",
          lastName: "Doe",
          email: "jane@example.com",
        },

        asset: {
          type: "vehicle",
          identifier: "ABC-123",
          attributes: {
            make: "Toyota",
            model: "Corolla",
            year: 2022,
          },
        },

        notes: "Realtime test",

        consent: true,
      });

    expect(requestResponse.status).toBe(201);

    requestPublicId = requestResponse.body.data.request.id;
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      const ids = [userAId, userBId].filter((id): id is string => Boolean(id));

      if (ids.length > 0) {
        await AppDataSource.getRepository(User).delete(ids);
      }
    }

    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  function connectSocket(token: string): Socket {
    return createClient(serverUrl, {
      transports: ["websocket"],

      forceNew: true,

      reconnection: false,

      auth: {
        token,
      },
    });
  }

  function waitForConnection(socket: Socket): Promise<void> {
    return new Promise((resolve, reject) => {
      socket.once("connect", () => {
        resolve();
      });

      socket.once("connect_error", reject);
    });
  }

  describe("Socket authentication", () => {
    it("should allow a valid authenticated user to connect", async () => {
      const socket = connectSocket(userAToken);

      try {
        await waitForConnection(socket);

        expect(socket.connected).toBe(true);
      } finally {
        socket.disconnect();
      }
    });

    it("should reject a connection without an access token", async () => {
      const socket = createClient(serverUrl, {
        transports: ["websocket"],

        forceNew: true,

        reconnection: false,
      });

      const error = await new Promise<Error>((resolve) => {
        socket.once("connect_error", (connectionError) => {
          resolve(connectionError);
        });
      });

      expect(error.message).toBe("AUTHENTICATION_REQUIRED");

      socket.disconnect();
    });

    it("should reject an invalid access token", async () => {
      const socket = connectSocket("invalid-token");

      const error = await new Promise<Error>((resolve) => {
        socket.once("connect_error", (connectionError) => {
          resolve(connectionError);
        });
      });

      expect(error.message).toBe("INVALID_ACCESS_TOKEN");

      socket.disconnect();
    });
  });

  describe("Request room authorization", () => {
    it("should allow the request owner to subscribe", async () => {
      const socket = connectSocket(userAToken);

      try {
        await waitForConnection(socket);

        const response = await new Promise<{
          success: boolean;
          requestId?: string;
          error?: string;
        }>((resolve) => {
          socket.emit(
            "request:subscribe",
            {
              requestId: requestPublicId,
            },
            resolve,
          );
        });

        expect(response.success).toBe(true);

        expect(response.requestId).toBe(requestPublicId);
      } finally {
        socket.disconnect();
      }
    });

    it("should prevent another user from subscribing to the request", async () => {
      const socket = connectSocket(userBToken);

      try {
        await waitForConnection(socket);

        const response = await new Promise<{
          success: boolean;
          error?: string;
        }>((resolve) => {
          socket.emit(
            "request:subscribe",
            {
              requestId: requestPublicId,
            },
            resolve,
          );
        });

        expect(response.success).toBe(false);

        expect(response.error).toBe("REQUEST_NOT_FOUND");
      } finally {
        socket.disconnect();
      }
    });

    it("should reject subscription to a nonexistent request", async () => {
      const socket = connectSocket(userAToken);

      try {
        await waitForConnection(socket);

        const response = await new Promise<{
          success: boolean;
          error?: string;
        }>((resolve) => {
          socket.emit(
            "request:subscribe",
            {
              requestId: "REQ_DOES_NOT_EXIST",
            },
            resolve,
          );
        });

        expect(response.success).toBe(false);

        expect(response.error).toBe("REQUEST_NOT_FOUND");
      } finally {
        socket.disconnect();
      }
    });
  });
});

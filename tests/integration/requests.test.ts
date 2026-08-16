import request from "supertest";

import app from "../../src/app";
import { AppDataSource } from "../../src/config/database";
import { User } from "../../src/modules/users/user.entity";
import { ServiceRequest } from "../../src/modules/requests/request.entity";

describe("Service Requests", () => {
  const userA = {
    email: `request-user-a-${Date.now()}@example.com`,
    fullName: "Request User A",
    password: "StrongPassword123!",
  };

  const userB = {
    email: `request-user-b-${Date.now()}@example.com`,
    fullName: "Request User B",
    password: "StrongPassword123!",
  };

  let userAId: string;
  let userBId: string;

  let userAToken: string;
  let userBToken: string;

  const requestBody = {
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

    notes: "Prefer morning fulfillment",

    consent: true,
  };

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

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
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      const userRepository = AppDataSource.getRepository(User);

      await userRepository.delete([userAId, userBId]);

      await AppDataSource.destroy();
    }
  });

  describe("POST /api/requests", () => {
    it("should create a service request for an authenticated user", async () => {
      const idempotencyKey = `create-${Date.now()}`;

      const response = await request(app)
        .post("/api/requests")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Idempotency-Key", idempotencyKey)
        .send(requestBody);

      expect(response.status).toBe(201);

      expect(response.body.success).toBe(true);

      expect(response.body.data.request.id).toBeDefined();

      expect(response.body.data.request.id).toMatch(/^REQ_/);

      expect(response.body.data.request.category).toBe(requestBody.category);

      expect(response.body.data.request.status).toBe("CREATED");

      expect(response.body.data.idempotentReplay).toBe(false);
    });

    it("should reject unauthenticated request creation", async () => {
      const response = await request(app)
        .post("/api/requests")
        .set("Idempotency-Key", `unauthenticated-${Date.now()}`)
        .send(requestBody);

      expect(response.status).toBe(401);
    });

    it("should reject creation without an Idempotency-Key", async () => {
      const response = await request(app)
        .post("/api/requests")
        .set("Authorization", `Bearer ${userAToken}`)
        .send(requestBody);

      expect(response.status).toBe(400);

      expect(response.body.error.code).toBe("IDEMPOTENCY_KEY_REQUIRED");
    });

    it("should reject creation when consent is false", async () => {
      const response = await request(app)
        .post("/api/requests")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Idempotency-Key", `consent-${Date.now()}`)
        .send({
          ...requestBody,
          consent: false,
        });

      expect(response.status).toBe(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return the same request for a duplicate submission", async () => {
      const idempotencyKey = `duplicate-${Date.now()}`;

      const firstResponse = await request(app)
        .post("/api/requests")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Idempotency-Key", idempotencyKey)
        .send(requestBody);

      expect(firstResponse.status).toBe(201);

      const secondResponse = await request(app)
        .post("/api/requests")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Idempotency-Key", idempotencyKey)
        .send(requestBody);

      expect(secondResponse.status).toBe(200);

      expect(secondResponse.body.data.idempotentReplay).toBe(true);

      expect(secondResponse.body.data.request.id).toBe(
        firstResponse.body.data.request.id,
      );
    });

    it("should create only one database record for the same idempotency key", async () => {
      const idempotencyKey = `db-duplicate-${Date.now()}`;

      await Promise.all([
        request(app)
          .post("/api/requests")
          .set("Authorization", `Bearer ${userAToken}`)
          .set("Idempotency-Key", idempotencyKey)
          .send(requestBody),

        request(app)
          .post("/api/requests")
          .set("Authorization", `Bearer ${userAToken}`)
          .set("Idempotency-Key", idempotencyKey)
          .send(requestBody),
      ]);

      const requestRepository = AppDataSource.getRepository(ServiceRequest);

      const count = await requestRepository.count({
        where: {
          userId: userAId,
          idempotencyKey,
        },
      });

      expect(count).toBe(1);
    });

    it("should not allow a user to access another user's request", async () => {
      const createResponse = await request(app)
        .post("/api/requests")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Idempotency-Key", `idor-${Date.now()}`)
        .send(requestBody);

      expect(createResponse.status).toBe(201);

      const userARequestId = createResponse.body.data.request.id;

      const response = await request(app)
        .get(`/api/requests/${userARequestId}`)
        .set("Authorization", `Bearer ${userBToken}`);

      expect(response.status).toBe(404);

      expect(response.body.error.code).toBe("REQUEST_NOT_FOUND");
    });
  });

  describe("GET /api/requests/:publicId", () => {
    it("should allow a user to retrieve their own request", async () => {
      const createResponse = await request(app)
        .post("/api/requests")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Idempotency-Key", `own-request-${Date.now()}`)
        .send(requestBody);

      expect(createResponse.status).toBe(201);

      const publicId = createResponse.body.data.request.id;

      const response = await request(app)
        .get(`/api/requests/${publicId}`)
        .set("Authorization", `Bearer ${userAToken}`);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.data.request.id).toBe(publicId);
    });
  });

  describe("GET /api/requests", () => {
    it("should return only requests owned by the authenticated user", async () => {
      const markerA = `history-a-${Date.now()}`;

      const markerB = `history-b-${Date.now()}`;

      const userARequest = await request(app)
        .post("/api/requests")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Idempotency-Key", markerA)
        .send({
          ...requestBody,
          notes: markerA,
        });

      const userBRequest = await request(app)
        .post("/api/requests")
        .set("Authorization", `Bearer ${userBToken}`)
        .set("Idempotency-Key", markerB)
        .send({
          ...requestBody,
          notes: markerB,
        });

      expect(userARequest.status).toBe(201);
      expect(userBRequest.status).toBe(201);

      const response = await request(app)
        .get("/api/requests")
        .set("Authorization", `Bearer ${userAToken}`);

      expect(response.status).toBe(200);

      const requests = response.body.data.requests;

      expect(
        requests.some((item: { notes: string }) => item.notes === markerA),
      ).toBe(true);

      expect(
        requests.some((item: { notes: string }) => item.notes === markerB),
      ).toBe(false);
    });
  });
});

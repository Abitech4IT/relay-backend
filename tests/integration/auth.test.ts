import request from "supertest";

import app from "../../src/app";
import { AppDataSource } from "../../src/config/database";
import { User } from "../../src/modules/users/user.entity";

describe("Authentication", () => {
  const testUser = {
    email: `auth-test-${Date.now()}@example.com`,
    fullName: "Integration Test",
    password: "StrongPassword123!",
  };

  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(registerResponse.status).toBe(201);

    userId = registerResponse.body.data.user.id;
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      const userRepository = AppDataSource.getRepository(User);

      if (userId) {
        await userRepository.delete(userId);
      }

      await AppDataSource.destroy();
    }
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const email = `register-${Date.now()}@example.com`;

      const response = await request(app).post("/api/auth/register").send({
        email,
        fullName: "Registration Test",
        password: "StrongPassword123!",
      });

      expect(response.status).toBe(201);

      expect(response.body.success).toBe(true);

      expect(response.body.data.user.email).toBe(email);

      expect(response.body.data.user.role).toBe("USER");

      expect(response.body.data.accessToken).toBeDefined();

      expect(response.body.data.refreshToken).toBeDefined();
    });
  });

  describe("POST /api/auth/login", () => {
    it("should allow only one concurrent refresh using the same token", async () => {
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(loginResponse.status).toBe(200);

      const oldRefreshToken = loginResponse.body.data.refreshToken;

      const [first, second] = await Promise.all([
        request(app).post("/api/auth/refresh").send({
          refreshToken: oldRefreshToken,
        }),

        request(app).post("/api/auth/refresh").send({
          refreshToken: oldRefreshToken,
        }),
      ]);

      const statuses = [first.status, second.status].sort();

      expect(statuses).toEqual([200, 401]);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should rotate the refresh token", async () => {
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(loginResponse.status).toBe(200);

      const oldRefreshToken = loginResponse.body.data.refreshToken;

      const refreshResponse = await request(app)
        .post("/api/auth/refresh")
        .send({
          refreshToken: oldRefreshToken,
        });

      expect(refreshResponse.status).toBe(200);

      expect(refreshResponse.body.success).toBe(true);

      const newRefreshToken = refreshResponse.body.data.refreshToken;

      expect(newRefreshToken).toBeDefined();

      expect(newRefreshToken).not.toBe(oldRefreshToken);
    });

    it("should reject reuse of a rotated refresh token", async () => {
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(loginResponse.status).toBe(200);

      const oldRefreshToken = loginResponse.body.data.refreshToken;

      const firstRefresh = await request(app).post("/api/auth/refresh").send({
        refreshToken: oldRefreshToken,
      });

      expect(firstRefresh.status).toBe(200);

      const secondRefresh = await request(app).post("/api/auth/refresh").send({
        refreshToken: oldRefreshToken,
      });

      expect(secondRefresh.status).toBe(401);

      expect(secondRefresh.body.error.code).toBe("REFRESH_TOKEN_REVOKED");
    });
  });

  describe("GET /api/auth/me", () => {
    it("should reject unauthenticated requests", async () => {
      const response = await request(app).get("/api/auth/me");

      expect(response.status).toBe(401);
    });

    it("should allow authenticated requests", async () => {
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(loginResponse.status).toBe(200);

      accessToken = loginResponse.body.data.accessToken;

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.data.user.email).toBe(testUser.email);
    });
  });

  describe("Admin authorization", () => {
    it("should reject USER access to admin routes", async () => {
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(loginResponse.status).toBe(200);

      accessToken = loginResponse.body.data.accessToken;

      const response = await request(app)
        .get("/api/admin/test")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(403);

      expect(response.body.error.code).toBe("INSUFFICIENT_PERMISSIONS");
    });
  });
});

import request from "supertest";
import bcrypt from "bcrypt";

import app from "../../src/app";
import { AppDataSource } from "../../src/config/database";

import { User } from "../../src/modules/users/user.entity";
import { AuditLog } from "../../src/modules/admin/audit-log.entity";

import { UserRole } from "../../src/common/constants/roles";
import { ServiceRequest } from "../../src/modules/requests/request.entity";
import { backgroundTaskTracker } from "../../src/common/utils/background-task-tracker";

jest.setTimeout(30000);

describe("Admin", () => {
  const normalUser = {
    email: `admin-test-user-${Date.now()}@example.com`,
    fullName: "Normal User",
    password: "StrongPassword123!",
  };

  const adminUser = {
    email: `admin-test-${Date.now()}@example.com`,
    fullName: "Admin User",
    password: "StrongAdminPassword123!",
  };

  let normalUserId: string;
  let adminUserId: string;

  let normalUserToken: string;
  let adminToken: string;

  let requestPublicId: string;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    //
    // Create normal USER through real registration endpoint.
    //
    const normalUserResponse = await request(app)
      .post("/api/auth/register")
      .send(normalUser);

    expect(normalUserResponse.status).toBe(201);

    normalUserId = normalUserResponse.body.data.user.id;

    normalUserToken = normalUserResponse.body.data.accessToken;

    //
    // Create ADMIN directly in DB.
    //
    const userRepository = AppDataSource.getRepository(User);

    const adminPasswordHash = await bcrypt.hash(adminUser.password, 12);

    const createdAdmin = await userRepository.save(
      userRepository.create({
        email: adminUser.email.trim().toLowerCase(),

        fullName: adminUser.fullName,

        passwordHash: adminPasswordHash,

        role: UserRole.ADMIN,

        isActive: true,
      }),
    );

    adminUserId = createdAdmin.id;

    //
    // Login through the real API so we test the actual auth flow.
    //
    const adminLoginResponse = await request(app).post("/api/auth/login").send({
      email: adminUser.email,
      password: adminUser.password,
    });

    expect(adminLoginResponse.status).toBe(200);

    adminToken = adminLoginResponse.body.data.accessToken;

    //
    // Create a request owned by the normal USER.
    //
    const requestResponse = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${normalUserToken}`)
      .set("Idempotency-Key", `admin-test-request-${Date.now()}`)
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

        notes: "Original request notes",

        consent: true,
      });

    expect(requestResponse.status).toBe(201);

    requestPublicId = requestResponse.body.data.request.id;
  });

  afterAll(async () => {
    await backgroundTaskTracker.waitForAll();
    if (!AppDataSource.isInitialized) {
      return;
    }

    const requestRepository = AppDataSource.getRepository(ServiceRequest);

    const auditRepository = AppDataSource.getRepository(AuditLog);

    const userRepository = AppDataSource.getRepository(User);

    if (requestPublicId) {
      const serviceRequest = await requestRepository.findOne({
        where: {
          publicId: requestPublicId,
        },
      });

      if (serviceRequest) {
        await auditRepository.delete({
          requestId: serviceRequest.id,
        });
      }
    }

    const ids = [normalUserId, adminUserId].filter((id): id is string =>
      Boolean(id),
    );

    if (ids.length > 0) {
      await userRepository.delete(ids);
    }

    await AppDataSource.destroy();
  });

  describe("Admin authorization", () => {
    it("should reject a normal USER from admin endpoints", async () => {
      const response = await request(app)
        .get(`/api/admin/requests/${requestPublicId}`)
        .set("Authorization", `Bearer ${normalUserToken}`);

      expect(response.status).toBe(403);

      expect(response.body.error.code).toBe("INSUFFICIENT_PERMISSIONS");
    });

    it("should reject unauthenticated access", async () => {
      const response = await request(app).get(
        `/api/admin/requests/${requestPublicId}`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/admin/requests/:publicId", () => {
    it("should allow ADMIN to view any request", async () => {
      const response = await request(app)
        .get(`/api/admin/requests/${requestPublicId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.data.request.id).toBe(requestPublicId);

      expect(response.body.data.request.userId).toBe(normalUserId);

      expect(response.body.data.request.category).toBe("vehicle-service");

      //
      // Sensitive auth fields must never leak.
      //
      expect(response.body.data.request.passwordHash).toBeUndefined();

      expect(response.body.data.request.refreshToken).toBeUndefined();
    });

    it("should return 404 for an unknown request", async () => {
      const response = await request(app)
        .get("/api/admin/requests/REQ_DOES_NOT_EXIST")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(404);

      expect(response.body.error.code).toBe("REQUEST_NOT_FOUND");
    });
  });

  describe("PATCH /api/admin/requests/:publicId", () => {
    it("should allow ADMIN to correct an allowed field", async () => {
      const response = await request(app)
        .patch(`/api/admin/requests/${requestPublicId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          field: "category",

          value: "vehicle-premium-service",

          reason: "Corrected service category after manual verification",
        });

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.data.request.category).toBe(
        "vehicle-premium-service",
      );
    });

    it("should create an audit record for the correction", async () => {
      const auditRepository = AppDataSource.getRepository(AuditLog);

      const audits = await auditRepository.find({
        where: {
          actorId: adminUserId,

          fieldName: "category",
        },

        order: {
          createdAt: "DESC",
        },
      });

      expect(audits.length).toBeGreaterThan(0);

      const audit = audits[0];

      expect(audit.actorId).toBe(adminUserId);

      expect(audit.fieldName).toBe("category");

      expect(audit.oldValue).toBe("vehicle-service");

      expect(audit.newValue).toBe("vehicle-premium-service");

      expect(audit.reason).toBe(
        "Corrected service category after manual verification",
      );

      expect(audit.createdAt).toBeInstanceOf(Date);
    });

    it("should reject a correction that does not change the value", async () => {
      const response = await request(app)
        .patch(`/api/admin/requests/${requestPublicId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          field: "category",

          value: "vehicle-premium-service",

          reason: "Trying the same value again",
        });

      expect(response.status).toBe(400);

      expect(response.body.error.code).toBe("NO_CORRECTION_CHANGE");
    });

    it("should reject a protected field", async () => {
      const response = await request(app)
        .patch(`/api/admin/requests/${requestPublicId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          field: "userId",

          value: adminUserId,

          reason: "Attempt to modify ownership",
        });

      expect(response.status).toBe(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject a correction without a meaningful reason", async () => {
      const response = await request(app)
        .patch(`/api/admin/requests/${requestPublicId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          field: "notes",

          value: "Updated notes",

          reason: "x",
        });

      expect(response.status).toBe(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/admin/requests/:publicId/audit-logs", () => {
    it("should allow ADMIN to view the audit trail", async () => {
      const response = await request(app)
        .get(`/api/admin/requests/${requestPublicId}/audit-logs`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      const auditLogs = response.body.data.auditLogs;

      expect(Array.isArray(auditLogs)).toBe(true);

      expect(auditLogs.length).toBeGreaterThan(0);

      expect(
        auditLogs.some(
          (audit: { field: string }) => audit.field === "category",
        ),
      ).toBe(true);
    });

    it("should reject a USER from viewing audit logs", async () => {
      const response = await request(app)
        .get(`/api/admin/requests/${requestPublicId}/audit-logs`)
        .set("Authorization", `Bearer ${normalUserToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("GET /api/admin/requests/:publicId/provider-results", () => {
    it("should allow ADMIN to inspect provider results", async () => {
      const response = await request(app)
        .get(`/api/admin/requests/${requestPublicId}/provider-results`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(Array.isArray(response.body.data.providerResults)).toBe(true);

      //
      // Even if no providers have been processed yet,
      // this endpoint should return [] rather than fail.
      //
      expect(response.body.data.providerResults).toBeDefined();
    });
  });
});

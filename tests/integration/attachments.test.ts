import request from "supertest";

import app from "../../src/app";
import { AppDataSource } from "../../src/config/database";

import { User } from "../../src/modules/users/user.entity";
import { Attachment } from "../../src/modules/attachments/attachment.entity";
import { backgroundTaskTracker } from "../../src/common/utils/background-task-tracker";

describe("Attachments", () => {
  const userA = {
    email: `attachment-user-a-${Date.now()}@example.com`,
    fullName: "Attachment User A",
    password: "StrongPassword123!",
  };

  const userB = {
    email: `attachment-user-b-${Date.now()}@example.com`,
    fullName: "Attachment User B",
    password: "StrongPassword123!",
  };

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

    notes: "Attachment integration test",

    consent: true,
  };

  let userAId: string;
  let userBId: string;

  let userAToken: string;
  let userBToken: string;

  let requestPublicId: string;

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

    const serviceRequestResponse = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${userAToken}`)
      .set("Idempotency-Key", `attachment-request-${Date.now()}`)
      .send(requestBody);

    expect(serviceRequestResponse.status).toBe(201);

    requestPublicId = serviceRequestResponse.body.data.request.id;
  });

  afterAll(async () => {
    await backgroundTaskTracker.waitForAll();
    if (!AppDataSource.isInitialized) {
      return;
    }

    const userRepository = AppDataSource.getRepository(User);

    const ids = [userAId, userBId].filter(Boolean);

    if (ids.length > 0) {
      await userRepository.delete(ids);
    }

    await AppDataSource.destroy();
  });

  describe("POST /api/requests/:publicId/attachments", () => {
    it("should upload a valid JPEG attachment", async () => {
      const response = await request(app)
        .post(`/api/requests/${requestPublicId}/attachments`)
        .set("Authorization", `Bearer ${userAToken}`)
        .attach("attachments", Buffer.from("fake-jpeg-content"), {
          filename: "vehicle-photo.jpg",

          contentType: "image/jpeg",
        });

      expect(response.status).toBe(201);

      expect(response.body.success).toBe(true);

      expect(response.body.data.attachments).toHaveLength(1);

      const attachment = response.body.data.attachments[0];

      expect(attachment.id).toBeDefined();

      expect(attachment.originalName).toBe("vehicle-photo.jpg");

      expect(attachment.mimeType).toBe("image/jpeg");

      expect(attachment.sizeBytes).toBeGreaterThan(0);

      expect(attachment.createdAt).toBeDefined();
    });

    it("should upload multiple valid attachments", async () => {
      const response = await request(app)
        .post(`/api/requests/${requestPublicId}/attachments`)
        .set("Authorization", `Bearer ${userAToken}`)
        .attach("attachments", Buffer.from("fake-jpeg-content"), {
          filename: "vehicle-front.jpg",

          contentType: "image/jpeg",
        })
        .attach("attachments", Buffer.from("fake-pdf-content"), {
          filename: "vehicle-document.pdf",

          contentType: "application/pdf",
        });

      expect(response.status).toBe(201);

      expect(response.body.success).toBe(true);

      expect(response.body.data.attachments).toHaveLength(2);

      const mimeTypes = response.body.data.attachments.map(
        (attachment: { mimeType: string }) => attachment.mimeType,
      );

      expect(mimeTypes).toContain("image/jpeg");

      expect(mimeTypes).toContain("application/pdf");
    });

    it("should reject an unsupported attachment type", async () => {
      const response = await request(app)
        .post(`/api/requests/${requestPublicId}/attachments`)
        .set("Authorization", `Bearer ${userAToken}`)
        .attach("attachments", Buffer.from("plain text content"), {
          filename: "notes.txt",

          contentType: "text/plain",
        });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.error.code).toBe("UNSUPPORTED_ATTACHMENT_TYPE");
    });

    it("should reject an attachment when MIME type and extension do not match", async () => {
      const response = await request(app)
        .post(`/api/requests/${requestPublicId}/attachments`)
        .set("Authorization", `Bearer ${userAToken}`)
        .attach("attachments", Buffer.from("fake content"), {
          filename: "document.pdf",

          contentType: "image/jpeg",
        });

      expect(response.status).toBe(400);

      expect(response.body.error.code).toBe("ATTACHMENT_TYPE_MISMATCH");
    });

    it("should reject an upload with no attachment", async () => {
      const response = await request(app)
        .post(`/api/requests/${requestPublicId}/attachments`)
        .set("Authorization", `Bearer ${userAToken}`);

      expect(response.status).toBe(400);

      expect(response.body.error.code).toBe("ATTACHMENTS_REQUIRED");
    });

    it("should prevent another user from uploading attachments to a request they do not own", async () => {
      const response = await request(app)
        .post(`/api/requests/${requestPublicId}/attachments`)
        .set("Authorization", `Bearer ${userBToken}`)
        .attach("attachments", Buffer.from("fake-image-content"), {
          filename: "unauthorized.jpg",

          contentType: "image/jpeg",
        });

      expect(response.status).toBe(404);

      expect(response.body.error.code).toBe("REQUEST_NOT_FOUND");
    });

    it("should reject unauthenticated attachment uploads", async () => {
      const response = await request(app)
        .post(`/api/requests/${requestPublicId}/attachments`)
        .attach("attachments", Buffer.from("fake-image-content"), {
          filename: "photo.jpg",

          contentType: "image/jpeg",
        });

      expect(response.status).toBe(401);

      expect(response.body.error.code).toBe("AUTHENTICATION_REQUIRED");
    });

    it("should sanitize unsafe filenames", async () => {
      const response = await request(app)
        .post(`/api/requests/${requestPublicId}/attachments`)
        .set("Authorization", `Bearer ${userAToken}`)
        .attach("attachments", Buffer.from("fake-image-content"), {
          filename: "my weird photo @#$%.jpg",

          contentType: "image/jpeg",
        });

      expect(response.status).toBe(201);

      const attachment = response.body.data.attachments[0];

      expect(attachment.originalName).not.toContain("@");

      expect(attachment.originalName).not.toContain("#");

      expect(attachment.originalName).not.toContain("$");

      expect(attachment.originalName).not.toContain("%");

      expect(attachment.originalName).toMatch(/\.jpg$/);
    });

    it("should not expose internal storage information", async () => {
      const response = await request(app)
        .post(`/api/requests/${requestPublicId}/attachments`)
        .set("Authorization", `Bearer ${userAToken}`)
        .attach("attachments", Buffer.from("fake-image-content"), {
          filename: "secure-photo.jpg",

          contentType: "image/jpeg",
        });

      expect(response.status).toBe(201);

      const attachment = response.body.data.attachments[0];

      expect(attachment.storageKey).toBeUndefined();

      expect(attachment.storedName).toBeUndefined();

      expect(attachment.path).toBeUndefined();

      const serialized = JSON.stringify(attachment);

      expect(serialized).not.toContain("storage/");

      expect(serialized).not.toContain("C:\\");
    });
  });

  describe("GET /api/requests/:publicId/attachments", () => {
    it("should allow the owner to list attachment metadata", async () => {
      const uploadResponse = await request(app)
        .post(`/api/requests/${requestPublicId}/attachments`)
        .set("Authorization", `Bearer ${userAToken}`)
        .attach("attachments", Buffer.from("list-test-image"), {
          filename: "list-photo.jpg",

          contentType: "image/jpeg",
        });

      expect(uploadResponse.status).toBe(201);

      const response = await request(app)
        .get(`/api/requests/${requestPublicId}/attachments`)
        .set("Authorization", `Bearer ${userAToken}`);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(Array.isArray(response.body.data.attachments)).toBe(true);

      expect(response.body.data.attachments.length).toBeGreaterThan(0);

      const attachment = response.body.data.attachments[0];

      expect(attachment.storageKey).toBeUndefined();

      expect(attachment.storedName).toBeUndefined();
    });

    it("should prevent another user from viewing attachment metadata", async () => {
      const response = await request(app)
        .get(`/api/requests/${requestPublicId}/attachments`)
        .set("Authorization", `Bearer ${userBToken}`);

      expect(response.status).toBe(404);

      expect(response.body.error.code).toBe("REQUEST_NOT_FOUND");
    });

    it("should reject unauthenticated attachment listing", async () => {
      const response = await request(app).get(
        `/api/requests/${requestPublicId}/attachments`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe("Attachment persistence", () => {
    it("should persist attachment metadata separately from the service request", async () => {
      const uploadResponse = await request(app)
        .post(`/api/requests/${requestPublicId}/attachments`)
        .set("Authorization", `Bearer ${userAToken}`)
        .attach("attachments", Buffer.from("database-test-image"), {
          filename: "database-photo.jpg",

          contentType: "image/jpeg",
        });

      expect(uploadResponse.status).toBe(201);

      const attachmentId = uploadResponse.body.data.attachments[0].id;

      const attachmentRepository = AppDataSource.getRepository(Attachment);

      const persistedAttachment = await attachmentRepository.findOne({
        where: {
          id: attachmentId,
        },
      });

      expect(persistedAttachment).not.toBeNull();

      expect(persistedAttachment!.requestId).toBeDefined();

      expect(persistedAttachment!.storageKey).toBeDefined();

      expect(persistedAttachment!.mimeType).toBe("image/jpeg");

      expect(persistedAttachment!.originalName).toBe("database-photo.jpg");
    });
  });
});

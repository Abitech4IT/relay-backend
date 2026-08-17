import swaggerJsdoc from "swagger-jsdoc";

const port = process.env.PORT || 5000;

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "Relay API",
      version: "1.0.0",

      description: `
Relay is a service-request aggregation backend.

It allows authenticated users to:

- create structured service requests
- upload secure attachments
- track request processing
- receive normalized provider offers
- view request history

Administrators can:

- review requests
- inspect provider execution results
- perform controlled corrections
- inspect immutable audit trails

Authentication uses short-lived access tokens and rotating refresh tokens.
      `.trim(),
    },

    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Local development server",
      },
    ],

    tags: [
      {
        name: "Health",
        description: "Application health endpoints",
      },
      {
        name: "Authentication",
        description: "Registration, authentication and session management",
      },
      {
        name: "Requests",
        description: "Service request creation and history",
      },
      {
        name: "Attachments",
        description: "Secure request attachment management",
      },
      {
        name: "Admin",
        description: "Administrative request review and corrections",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Access token returned by the login or refresh endpoint.",
        },
      },

      schemas: {
        Error: {
          type: "object",

          required: ["code", "message"],

          properties: {
            code: {
              type: "string",
              example: "VALIDATION_ERROR",
            },

            message: {
              type: "string",
              example: "Invalid request body",
            },

            details: {
              nullable: true,
              description:
                "Optional structured information describing the error.",
            },
          },
        },

        ErrorResponse: {
          type: "object",

          required: ["success", "error"],

          properties: {
            success: {
              type: "boolean",
              example: false,
            },

            error: {
              $ref: "#/components/schemas/Error",
            },
          },
        },

        User: {
          type: "object",

          required: ["id", "email", "fullName", "role"],

          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "a1a6e551-cf20-4ac4-bd6c-0f60b8ac806e",
            },

            email: {
              type: "string",
              format: "email",
              example: "jane@example.com",
            },

            fullName: {
              type: "string",
              example: "Jane Doe",
            },

            role: {
              type: "string",
              enum: ["USER", "ADMIN"],
              example: "USER",
            },
          },
        },

        RegisterRequest: {
          type: "object",

          required: ["email", "fullName", "password"],

          properties: {
            email: {
              type: "string",
              format: "email",
              example: "jane@example.com",
            },

            fullName: {
              type: "string",
              example: "Jane Doe",
            },

            password: {
              type: "string",
              format: "password",
              example: "StrongPassword123!",
            },
          },
        },

        LoginRequest: {
          type: "object",

          required: ["email", "password"],

          properties: {
            email: {
              type: "string",
              format: "email",
              example: "jane@example.com",
            },

            password: {
              type: "string",
              format: "password",
              example: "StrongPassword123!",
            },
          },
        },

        RefreshTokenRequest: {
          type: "object",

          required: ["refreshToken"],

          properties: {
            refreshToken: {
              type: "string",
              description:
                "Refresh token returned by login or a previous refresh operation.",
            },
          },
        },

        AuthTokens: {
          type: "object",

          required: ["accessToken", "refreshToken"],

          properties: {
            accessToken: {
              type: "string",
            },

            refreshToken: {
              type: "string",
            },
          },
        },

        AuthResponse: {
          type: "object",

          properties: {
            success: {
              type: "boolean",
              example: true,
            },

            data: {
              type: "object",

              properties: {
                user: {
                  $ref: "#/components/schemas/User",
                },

                accessToken: {
                  type: "string",
                },

                refreshToken: {
                  type: "string",
                },
              },
            },
          },
        },

        CustomerProfile: {
          type: "object",

          required: ["firstName", "lastName"],

          properties: {
            firstName: {
              type: "string",
              example: "Jane",
            },

            lastName: {
              type: "string",
              example: "Doe",
            },

            email: {
              type: "string",
              format: "email",
              example: "jane@example.com",
            },

            phone: {
              type: "string",
              example: "+2348012345678",
            },
          },
        },

        Asset: {
          type: "object",

          required: ["type", "attributes"],

          properties: {
            type: {
              type: "string",
              example: "vehicle",
            },

            identifier: {
              type: "string",
              example: "ABC-123",
            },

            attributes: {
              type: "object",

              additionalProperties: true,

              example: {
                make: "Toyota",
                model: "Corolla",
                year: 2022,
              },
            },
          },
        },

        CreateServiceRequest: {
          type: "object",

          required: ["category", "customerProfile", "asset", "consent"],

          properties: {
            category: {
              type: "string",
              example: "vehicle-service",
            },

            customerProfile: {
              $ref: "#/components/schemas/CustomerProfile",
            },

            asset: {
              $ref: "#/components/schemas/Asset",
            },

            notes: {
              type: "string",
              nullable: true,
              example: "Prefer morning fulfillment",
            },

            consent: {
              type: "boolean",
              enum: [true],
              example: true,

              description: "Must be true before a request can be created.",
            },
          },
        },

        ServiceRequest: {
          type: "object",

          required: [
            "id",
            "category",
            "customerProfile",
            "asset",
            "consent",
            "status",
            "createdAt",
            "updatedAt",
          ],

          properties: {
            id: {
              type: "string",
              example: "REQ_A5533AA06CB57CA542ED",

              description: "Public-safe request identifier.",
            },

            category: {
              type: "string",
              example: "vehicle-service",
            },

            customerProfile: {
              $ref: "#/components/schemas/CustomerProfile",
            },

            asset: {
              $ref: "#/components/schemas/Asset",
            },

            notes: {
              type: "string",
              nullable: true,
              example: "Prefer morning fulfillment",
            },

            consent: {
              type: "boolean",
              example: true,
            },

            status: {
              type: "string",

              enum: [
                "CREATED",
                "PROCESSING",
                "PARTIAL_RESULTS",
                "READY_FOR_REVIEW",
                "COMPLETED",
                "FAILED",
              ],

              example: "CREATED",
            },

            createdAt: {
              type: "string",
              format: "date-time",
            },

            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        Attachment: {
          type: "object",

          required: [
            "id",
            "originalName",
            "mimeType",
            "sizeBytes",
            "createdAt",
          ],

          properties: {
            id: {
              type: "string",
              format: "uuid",
            },

            originalName: {
              type: "string",
              example: "vehicle-photo.jpg",
            },

            mimeType: {
              type: "string",

              enum: [
                "image/jpeg",
                "image/png",
                "image/webp",
                "application/pdf",
              ],

              example: "image/jpeg",
            },

            sizeBytes: {
              type: "integer",
              example: 245810,
            },

            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        ProviderResult: {
          type: "object",

          properties: {
            id: {
              type: "string",
              format: "uuid",
            },

            provider: {
              type: "string",

              enum: ["ALPHA", "BETA", "GAMMA"],
            },

            status: {
              type: "string",

              enum: [
                "SUCCESS",
                "FAILED",
                "TIMEOUT",
                "INVALID_RESPONSE",
                "TEMPORARY_ERROR",
              ],
            },

            externalResultId: {
              type: "string",
              nullable: true,
            },

            errorCode: {
              type: "string",
              nullable: true,
            },

            errorMessage: {
              type: "string",
              nullable: true,
            },

            durationMs: {
              type: "integer",
              example: 132,
            },

            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        Offer: {
          type: "object",

          properties: {
            id: {
              type: "string",
              format: "uuid",
            },

            provider: {
              type: "string",
              enum: ["ALPHA", "BETA", "GAMMA"],
            },

            baseAmount: {
              type: "number",
              format: "double",
              example: 1000,
            },

            fees: {
              type: "number",
              format: "double",
              example: 75,
            },

            totalAmount: {
              type: "number",
              format: "double",
              example: 1075,
            },

            benefits: {
              type: "array",

              items: {
                type: "string",
              },
            },

            terms: {
              type: "array",

              items: {
                type: "string",
              },
            },

            customerContribution: {
              type: "number",
              format: "double",
              example: 100,
            },

            validUntil: {
              type: "string",
              format: "date-time",
            },

            estimatedFulfillmentMinutes: {
              type: "integer",
              example: 30,
            },

            status: {
              type: "string",

              enum: ["VALID", "INVALID", "EXPIRED"],
            },

            rank: {
              type: "integer",
              nullable: true,
              example: 1,
            },

            score: {
              type: "number",
              nullable: true,
              example: 0.87,
            },

            rankingExplanation: {
              type: "object",
              nullable: true,

              additionalProperties: true,
            },

            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        AdminRequest: {
          allOf: [
            {
              $ref: "#/components/schemas/ServiceRequest",
            },

            {
              type: "object",

              properties: {
                userId: {
                  type: "string",
                  format: "uuid",
                },
              },
            },
          ],
        },

        AdminCorrection: {
          type: "object",

          required: ["field", "value", "reason"],

          properties: {
            field: {
              type: "string",

              enum: ["category", "customerProfile", "asset", "notes"],

              example: "category",
            },

            value: {
              description:
                "Replacement value for the selected correctable field.",

              example: "vehicle-premium-service",
            },

            reason: {
              type: "string",
              minLength: 5,
              maxLength: 500,

              example: "Corrected after manual verification",
            },
          },
        },

        AuditLog: {
          type: "object",

          properties: {
            id: {
              type: "string",
              format: "uuid",
            },

            actorId: {
              type: "string",
              format: "uuid",
            },

            field: {
              type: "string",
              example: "category",
            },

            oldValue: {
              nullable: true,
              example: "vehicle-service",
            },

            newValue: {
              nullable: true,
              example: "vehicle-premium-service",
            },

            reason: {
              type: "string",

              example: "Corrected after manual verification",
            },

            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
      },

      parameters: {
        PublicRequestId: {
          name: "publicId",
          in: "path",
          required: true,

          description: "Public-safe Relay request identifier.",

          schema: {
            type: "string",
            example: "REQ_A5533AA06CB57CA542ED",
          },
        },

        IdempotencyKey: {
          name: "Idempotency-Key",
          in: "header",
          required: true,

          description: `
Unique key used to make request creation idempotent.

Repeating the same key with the same payload returns the existing request.
Using the same key with a different payload returns a conflict.
          `.trim(),

          schema: {
            type: "string",
            maxLength: 255,

            example: "request-550e8400-e29b-41d4-a716-446655440000",
          },
        },
      },

      responses: {
        Unauthorized: {
          description:
            "Authentication is required or the access token is invalid.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },

              example: {
                success: false,

                error: {
                  code: "AUTHENTICATION_REQUIRED",

                  message: "Authentication required",
                },
              },
            },
          },
        },

        Forbidden: {
          description:
            "Authenticated user does not have sufficient permissions.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },

              example: {
                success: false,

                error: {
                  code: "INSUFFICIENT_PERMISSIONS",

                  message: "Insufficient permissions",
                },
              },
            },
          },
        },

        RequestNotFound: {
          description:
            "Request does not exist or is not accessible by the current user.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },

              example: {
                success: false,

                error: {
                  code: "REQUEST_NOT_FOUND",

                  message: "Service request not found",
                },
              },
            },
          },
        },

        ValidationError: {
          description: "Request validation failed.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },

              example: {
                success: false,

                error: {
                  code: "VALIDATION_ERROR",

                  message: "Invalid request body",
                },
              },
            },
          },
        },
      },
    },
  },

  apis: ["./src/app.ts", "./src/modules/**/*.routes.ts"],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

import swaggerJsdoc from "swagger-jsdoc";

import { env } from "./env";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "Relay API",
      version: "1.0.0",

      description:
        "Backend API for the Relay service-request aggregation platform.",
    },

    servers: [
      {
        url: `http://localhost:${env.PORT}`,

        description: "Local development",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },

      schemas: {
        ErrorResponse: {
          type: "object",

          properties: {
            success: {
              type: "boolean",
              example: false,
            },

            error: {
              type: "object",

              properties: {
                code: {
                  type: "string",
                },

                message: {
                  type: "string",
                },
              },
            },
          },
        },
      },
    },
  },

  apis: ["./src/modules/**/*.routes.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);

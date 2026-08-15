import { z } from "zod";

const customerProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(100),

  lastName: z.string().trim().min(1).max(100),

  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .transform((value) => value.toLowerCase())
    .optional(),

  phone: z.string().trim().min(5).max(30).optional(),
});

const assetSchema = z.object({
  type: z.string().trim().min(1).max(100),

  identifier: z.string().trim().max(150).optional(),

  attributes: z.record(z.string(), z.unknown()),
});

export const createServiceRequestSchema = z.object({
  category: z.string().trim().min(2).max(100),

  customerProfile: customerProfileSchema,

  asset: assetSchema,

  notes: z.string().trim().max(2000).optional(),

  consent: z.literal(true),
});

export type CreateServiceRequestBody = z.infer<
  typeof createServiceRequestSchema
>;

import { z } from "zod";

export const adminCorrectionSchema = z.object({
  field: z.enum(["category", "customerProfile", "asset", "notes"]),

  value: z.unknown(),

  reason: z.string().trim().min(5).max(500),
});

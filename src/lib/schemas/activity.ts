import { z } from "zod";

export const ACTIVITY_ENTITIES = [
  "book",
  "member",
  "loan",
  "fine",
  "author",
] as const;

export const activityQueryInput = z.object({
  entity: z.enum(ACTIVITY_ENTITIES).optional(),
  entityId: z.string().uuid("Must be a valid UUID.").optional(),
  adminId: z.string().uuid("Must be a valid UUID.").optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

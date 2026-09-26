import z from "zod";

export const activityQuerySchema = z.object({
  entity: z.enum(["book", "member", "loan", "fine"]).optional(),
  entity_id: z.uuid("Must be a valid UUID.").optional(),
  admin_id: z.uuid("Must be a valid UUID.").optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

import { z } from "zod";

export const idInput = z.object({ id: z.string().uuid("Must be a valid id.") });

export const memberIdInput = z.object({
  memberId: z.string().uuid("Must be a valid id."),
});

export const hasAnyField = (data: Record<string, unknown>) =>
  Object.values(data).some((value) => value !== undefined);

export const NO_FIELDS = "At least one field must be provided.";

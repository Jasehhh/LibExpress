import { z } from "zod";

export const idInput = z.object({ id: z.string().uuid("Must be a valid id.") });

// For patch inputs: the old API answered 400 when nothing was sent.
export const hasAnyField = (data: Record<string, unknown>) =>
  Object.values(data).some((value) => value !== undefined);

export const NO_FIELDS = "At least one field must be provided.";

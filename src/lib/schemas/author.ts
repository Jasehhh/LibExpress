import { z } from "zod";

import { hasAnyField, NO_FIELDS } from "./common";

export const authorInput = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
});

export const authorPatchInput = authorInput
  .partial()
  .refine(hasAnyField, NO_FIELDS);

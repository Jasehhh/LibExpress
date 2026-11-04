import { z } from "zod";

import { hasAnyField, NO_FIELDS } from "./common";

export const MEMBER_STATUSES = ["ACTIVE", "SUSPENDED"] as const;

export const memberInput = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email must be a valid email.")
    .max(255, "Email must be at most 255 characters."),
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
});

export const memberPatchInput = memberInput
  .extend({ status: z.enum(MEMBER_STATUSES) })
  .partial()
  .refine(hasAnyField, NO_FIELDS);

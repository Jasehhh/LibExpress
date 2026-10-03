import { z } from "zod";

import { hasAnyField, NO_FIELDS } from "./common";

export const MEMBER_ROLES = ["USER", "ADMIN"] as const;
export const MEMBER_STATUSES = ["ACTIVE", "SUSPENDED"] as const;

export const memberInput = z.object({
  email: z.string().email("Email must be a valid email."),
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
});

export const memberPatchInput = memberInput
  .extend({
    role: z.enum(MEMBER_ROLES),
    status: z.enum(MEMBER_STATUSES),
  })
  .partial()
  .refine(hasAnyField, NO_FIELDS);

import { z } from "zod";

export const PAYMENT_STATUSES = ["PAID", "UNPAID"] as const;

export const finePatchInput = z.object({
  id: z.string().uuid("Must be a valid id."),
  paymentStatus: z.enum(PAYMENT_STATUSES),
});

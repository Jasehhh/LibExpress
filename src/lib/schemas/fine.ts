import { z } from "zod";

// Not stored: a fine is paid once it has a paid_at.
export const PAYMENT_STATUSES = ["PAID", "UNPAID"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const finePatchInput = z.object({
  id: z.string().uuid("Must be a valid id."),
  paymentStatus: z.enum(PAYMENT_STATUSES),
});

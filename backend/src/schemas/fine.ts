import z from "zod";

const baseFineSchema = z.object({
  amount: z.number().nonnegative("Amount cannot be negative."),
  payment_status: z.enum(["PAID", "UNPAID"]).default("UNPAID"),
});

export const fineBodySchema = baseFineSchema;

export const finePatchSchema = baseFineSchema.pick({ payment_status: true });

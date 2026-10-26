import { z } from "zod";

// Lending rules, shared so the desk screen shows what the server will apply.
export const LOAN_PERIOD_DAYS = 14;
export const FINE_PER_DAY = 20;
const DAY_MS = 1000 * 60 * 60 * 24;

export const daysLate = (dueDate: Date, at = new Date()) =>
  Math.max(0, Math.ceil((at.getTime() - dueDate.getTime()) / DAY_MS));

export const LOAN_STATUSES = ["ACTIVE", "OVERDUE", "RETURNED"] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export const loanInput = z.object({
  memberId: z.string().uuid("Must be a valid member id."),
  bookId: z.string().uuid("Must be a valid book id."),
});

export const loanReturnInput = z.object({
  id: z.string().uuid("Must be a valid id."),
  returnDate: z.coerce.date(),
});

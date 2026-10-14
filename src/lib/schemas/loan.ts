import { z } from "zod";

// Not stored: worked out from return_date and due_date when a loan is read.
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

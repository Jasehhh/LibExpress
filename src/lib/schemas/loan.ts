import { z } from "zod";

export const loanInput = z.object({
  memberId: z.string().uuid("Must be a valid member id."),
  bookId: z.string().uuid("Must be a valid book id."),
});

export const loanReturnInput = z.object({
  id: z.string().uuid("Must be a valid id."),
  returnDate: z.coerce.date(),
});

import z from "zod";

export const loanBodySchema = z.object({
  member_id: z.uuid(),
  book_id: z.uuid(),
});

export const loanPatchSchema = z.object({ return_date: z.coerce.date() });

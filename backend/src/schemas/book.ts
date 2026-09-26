import z from "zod";

export const bookBodySchema = z.object({
  isbn: z.string().min(5, "Must be a valid ISBN."),
  title: z.string().min(2, "Must be at least 2 characters."),
  author_id: z.uuid("Must be a valid author id."),
  url: z.url("Must be a valid URL.").optional(),
  genre: z.string(),
  total_copies: z
    .number()
    .int()
    .nonnegative("Total copies cannot be negative.")
    .default(0),
});

export const bookPatchSchema = bookBodySchema.partial();

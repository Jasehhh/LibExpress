import z from "zod";

const baseBookSchema = z.object({
  isbn: z.string().min(5, "Must be a valid ISBN."),
  title: z.string().min(2, "Must be at least 2 characters."),
  author: z.string().min(3, "Must be at least 3 characters."),
  genre: z.string(),
  total_copies: z
    .number()
    .int()
    .nonnegative("Total copies cannot be negative.")
    .default(0),
  available_copies: z
    .number()
    .int()
    .nonnegative("Available copies cannot be negative.")
    .default(0),
});

export const bookBodySchema = baseBookSchema.refine(
  (data) => data.available_copies <= data.total_copies,
  {
    message: "Available copies cannot exceed total copies.",
    path: ["available_copies"],
  },
);

export const bookPatchSchema = baseBookSchema
  .partial()
  .refine(
    (data) =>
      data.available_copies === undefined ||
      data.total_copies === undefined ||
      data.available_copies <= data.total_copies,
    {
      message: "Available copies cannot exceed total copies.",
      path: ["available_copies"],
    },
  );

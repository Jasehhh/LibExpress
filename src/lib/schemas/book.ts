import { z } from "zod";

import { authorInput } from "./author";
import { hasAnyField, NO_FIELDS } from "./common";

export const BOOK_GENRES = [
  "FANTASY",
  "SCIFI",
  "HORROR",
  "ROMANCE",
  "MYSTERY",
  "THRILLER",
  "ADVENTURE",
  "DRAMA",
  "COMEDY",
  "OTHERS",
] as const;

const NO_AUTHORS = {
  message: "A book needs at least one author.",
  path: ["authorIds"],
};

const bookFields = z.object({
  isbn: z
    .string()
    .min(5, "Must be a valid ISBN.")
    .max(13, "Must be a valid ISBN."),
  title: z
    .string()
    .min(2, "Must be at least 2 characters.")
    .max(255, "Must be at most 255 characters."),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters.")
    .optional(),
  authorIds: z
    .array(z.string().uuid("Must be a valid author id."))
    .transform((ids) => [...new Set(ids)])
    .default([]),
  newAuthors: z.array(authorInput).default([]),
  url: z.string().url("Must be a valid URL.").optional(),
  genre: z.enum(BOOK_GENRES),
  totalCopies: z
    .number()
    .int()
    .nonnegative("Total copies cannot be negative.")
    .default(0),
});

export const bookInput = bookFields.refine(
  (book) => book.authorIds.length + book.newAuthors.length > 0,
  NO_AUTHORS,
);

export const bookPatchInput = bookFields
  .partial()
  .refine(hasAnyField, NO_FIELDS)
  .refine(
    (book) =>
      book.authorIds === undefined ||
      book.authorIds.length + (book.newAuthors?.length ?? 0) > 0,
    NO_AUTHORS,
  );

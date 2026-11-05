import { type Prisma } from "../../../generated/prisma";

import { conflict, onDuplicate } from "./db";

type Name = { firstName: string; lastName: string };

// Two authors with one name can't be told apart in the book form, so each
// name is used once, ignoring case. The unique index `author_name_key` backs
// this up when two requests add the same name at once.
export async function assertNameFree(
  tx: Prisma.TransactionClient,
  name: Name,
  exceptId?: string,
) {
  const taken = await tx.author.findFirst({
    where: {
      firstName: { equals: name.firstName, mode: "insensitive" },
      lastName: { equals: name.lastName, mode: "insensitive" },
      ...(exceptId && { id: { not: exceptId } }),
    },
  });
  if (taken) throw nameTaken(taken);
}

const nameTaken = (name: Name) =>
  conflict(`${name.firstName} ${name.lastName} is already in the author list.`);

export const authorNameTaken = onDuplicate(
  "That name is already in the author list.",
);

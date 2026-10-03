import { TRPCError } from "@trpc/server";

import { Prisma } from "../../../generated/prisma";

type LockableTable = "author" | "book" | "member" | "loan" | "fine";

// SELECT ... FOR UPDATE, which Prisma has no query for. Holds the row until
// the transaction ends and says whether it exists.
export async function lockRow(
  tx: Prisma.TransactionClient,
  table: LockableTable,
  id: string,
) {
  const rows = await tx.$queryRawUnsafe<unknown[]>(
    `SELECT 1 FROM "${table}" WHERE id = $1::uuid FOR UPDATE`,
    id,
  );
  return rows.length > 0;
}

// Postgres foreign_key_violation, e.g. deleting a row other rows still point to.
export const isForeignKeyViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2003";

export const notFound = (message: string) =>
  new TRPCError({ code: "NOT_FOUND", message });

export const badRequest = (message: string) =>
  new TRPCError({ code: "BAD_REQUEST", message });

export const conflict = (message: string) =>
  new TRPCError({ code: "CONFLICT", message });

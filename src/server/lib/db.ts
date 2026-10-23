import { TRPCError } from "@trpc/server";

import { type Prisma } from "../../../generated/prisma";

type LockableTable = "author" | "book" | "member" | "loan" | "fine";

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

export const notFound = (message: string) =>
  new TRPCError({ code: "NOT_FOUND", message });

export const badRequest = (message: string) =>
  new TRPCError({ code: "BAD_REQUEST", message });

export const conflict = (message: string) =>
  new TRPCError({ code: "CONFLICT", message });

import { type Session } from "next-auth";

import { type Prisma } from "../../../generated/prisma";

export type ActivityAction = "CREATE" | "UPDATE" | "DELETE";
export type ActivityEntity = "book" | "member" | "loan" | "fine" | "author";

export interface ActivityEntry {
  action: ActivityAction;
  entity: ActivityEntity;
  entityId: string | null;
  details: unknown;
}

// Dates become ISO strings and decimals become strings, so rows can go
// straight into the JSON details column.
const toJson = (value: unknown) =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

async function insertLog(
  tx: Prisma.TransactionClient,
  adminId: string | null,
  adminEmail: string | null,
  entry: ActivityEntry,
) {
  await tx.activityLog.create({
    data: {
      adminId,
      adminEmail,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      details: entry.details == null ? undefined : toJson(entry.details),
    },
  });
}

export async function logActivity(
  tx: Prisma.TransactionClient,
  session: Session,
  entry: ActivityEntry,
) {
  await insertLog(tx, session.user.id, session.user.email ?? null, entry);
}

export async function logSystemActivity(
  tx: Prisma.TransactionClient,
  entry: ActivityEntry,
) {
  await insertLog(tx, null, null, entry);
}

// The fields that changed between two versions of a row, or null if none did.
export function diff(before: object, after: object) {
  const oldRow = toJson(before) as Record<string, unknown>;
  const newRow = toJson(after) as Record<string, unknown>;
  const changedBefore: Record<string, unknown> = {};
  const changedAfter: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(oldRow), ...Object.keys(newRow)]);

  for (const key of keys) {
    const oldValue = oldRow[key] ?? null;
    const newValue = newRow[key] ?? null;
    if (oldValue !== newValue) {
      changedBefore[key] = oldValue;
      changedAfter[key] = newValue;
    }
  }

  if (Object.keys(changedAfter).length === 0) return null;
  return { before: changedBefore, after: changedAfter };
}

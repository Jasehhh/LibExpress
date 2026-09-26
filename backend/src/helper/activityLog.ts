import { Request } from "express";

export type ActivityAction = "CREATE" | "UPDATE" | "DELETE";
export type ActivityEntity = "book" | "member" | "loan" | "fine";

export interface Queryable {
  query(text: string, values?: unknown[]): Promise<unknown>;
}

export interface ActivityEntry {
  action: ActivityAction;
  entity: ActivityEntity;
  entityId: string | null;
  details: unknown;
}

const INSERT_LOG = `INSERT INTO activity_log (admin_id, admin_email, action, entity, entity_id, details)
  VALUES ($1, $2, $3, $4, $5, $6)`;

async function insertLog(
  db: Queryable,
  adminId: string | null,
  adminEmail: string | null,
  entry: ActivityEntry,
) {
  // Serialize ourselves: pg would turn a top-level array into a Postgres array.
  const details = entry.details == null ? null : JSON.stringify(entry.details);
  await db.query(INSERT_LOG, [
    adminId,
    adminEmail,
    entry.action,
    entry.entity,
    entry.entityId,
    details,
  ]);
}

export async function logActivity(
  db: Queryable,
  req: Request,
  entry: ActivityEntry,
) {
  const admin = req.admin;
  if (!admin || typeof admin === "string" || typeof admin.id !== "string") {
    throw new Error("logActivity requires an authenticated admin");
  }
  const email = typeof admin.email === "string" ? admin.email : null;
  await insertLog(db, admin.id, email, entry);
}

export async function logSystemActivity(db: Queryable, entry: ActivityEntry) {
  await insertLog(db, null, null, entry);
}

function sameValue(a: unknown, b: unknown) {
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  return a === b;
}

export function diff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
) {
  const changedBefore: Record<string, unknown> = {};
  const changedAfter: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of keys) {
    const oldValue = before[key] ?? null;
    const newValue = after[key] ?? null;
    if (!sameValue(oldValue, newValue)) {
      changedBefore[key] = oldValue;
      changedAfter[key] = newValue;
    }
  }

  if (Object.keys(changedAfter).length === 0) return null;
  return { before: changedBefore, after: changedAfter };
}

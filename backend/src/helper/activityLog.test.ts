import { test } from "node:test";
import assert from "node:assert/strict";
import type { Request } from "express";
import { diff, logActivity, logSystemActivity } from "./activityLog";

function fakeDb(fail = false) {
  const calls: { text: string; values: unknown[] }[] = [];
  return {
    calls,
    async query(text: string, values: unknown[] = []) {
      calls.push({ text, values });
      if (fail) throw new Error("insert failed");
      return { rows: [] };
    },
  };
}

const staffReq = {
  admin: { id: "11111111-1111-1111-1111-111111111111", email: "staff@lib.com" },
} as unknown as Request;

test("diff keeps only changed fields", () => {
  assert.deepEqual(
    diff({ title: "Dune", genre: "SCIFI" }, { title: "Dune Messiah", genre: "SCIFI" }),
    { before: { title: "Dune" }, after: { title: "Dune Messiah" } },
  );
});

test("diff returns null when nothing changed", () => {
  assert.equal(diff({ a: 1, b: "x" }, { a: 1, b: "x" }), null);
});

test("diff compares dates by value", () => {
  const t = "2026-09-26T10:00:00.000Z";
  assert.equal(diff({ due: new Date(t) }, { due: new Date(t) }), null);
  assert.deepEqual(
    diff({ due: new Date(t) }, { due: new Date("2026-09-27T10:00:00.000Z") }),
    {
      before: { due: new Date(t) },
      after: { due: new Date("2026-09-27T10:00:00.000Z") },
    },
  );
});

test("diff treats missing keys as null", () => {
  assert.deepEqual(diff({ a: 1 }, { b: 2 }), {
    before: { a: 1, b: null },
    after: { a: null, b: 2 },
  });
  assert.equal(diff({ a: null }, {}), null);
});

test("logActivity writes the actor and JSON details", async () => {
  const db = fakeDb();
  await logActivity(db, staffReq, {
    action: "UPDATE",
    entity: "book",
    entityId: "22222222-2222-2222-2222-222222222222",
    details: { before: { title: "Dune" }, after: { title: "Dune Messiah" } },
  });
  assert.equal(db.calls.length, 1);
  const call = db.calls[0]!;
  assert.match(call.text, /INSERT INTO activity_log/);
  assert.deepEqual(call.values, [
    "11111111-1111-1111-1111-111111111111",
    "staff@lib.com",
    "UPDATE",
    "book",
    "22222222-2222-2222-2222-222222222222",
    JSON.stringify({ before: { title: "Dune" }, after: { title: "Dune Messiah" } }),
  ]);
});

test("logActivity stores SQL NULL when details is null", async () => {
  const db = fakeDb();
  await logActivity(db, staffReq, {
    action: "DELETE",
    entity: "member",
    entityId: null,
    details: null,
  });
  assert.equal(db.calls[0]!.values[5], null);
});

test("logActivity throws without an authenticated admin", async () => {
  const db = fakeDb();
  const entry = { action: "CREATE", entity: "book", entityId: null, details: null } as const;
  await assert.rejects(logActivity(db, {} as Request, entry), /authenticated admin/);
  await assert.rejects(
    logActivity(db, { admin: "raw-token-string" } as unknown as Request, entry),
    /authenticated admin/,
  );
  await assert.rejects(
    logActivity(db, { admin: { email: "x@y.z" } } as unknown as Request, entry),
    /authenticated admin/,
  );
  assert.equal(db.calls.length, 0);
});

test("logActivity propagates db errors", async () => {
  await assert.rejects(
    logActivity(fakeDb(true), staffReq, {
      action: "CREATE",
      entity: "loan",
      entityId: null,
      details: null,
    }),
    /insert failed/,
  );
});

test("logSystemActivity writes a null actor", async () => {
  const db = fakeDb();
  await logSystemActivity(db, {
    action: "UPDATE",
    entity: "loan",
    entityId: null,
    details: { loan_ids: ["a", "b"] },
  });
  assert.deepEqual(db.calls[0]!.values, [
    null,
    null,
    "UPDATE",
    "loan",
    null,
    JSON.stringify({ loan_ids: ["a", "b"] }),
  ]);
});

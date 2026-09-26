import { test } from "node:test";
import assert from "node:assert/strict";
import { activityQuerySchema } from "./activity";

const uuid = "22222222-2222-4222-8222-222222222222";

test("defaults limit and offset", () => {
  assert.deepEqual(activityQuerySchema.parse({}), { limit: 50, offset: 0 });
});

test("coerces numeric strings and keeps filters", () => {
  assert.deepEqual(
    activityQuerySchema.parse({
      entity: "book",
      entity_id: uuid,
      admin_id: uuid,
      limit: "10",
      offset: "20",
    }),
    { entity: "book", entity_id: uuid, admin_id: uuid, limit: 10, offset: 20 },
  );
});

test("rejects out-of-range or malformed values", () => {
  for (const bad of [
    { limit: "0" },
    { limit: "201" },
    { limit: "abc" },
    { offset: "-1" },
    { entity: "admin" },
    { entity_id: "not-a-uuid" },
    { admin_id: "123" },
  ]) {
    assert.equal(
      activityQuerySchema.safeParse(bad).success,
      false,
      JSON.stringify(bad),
    );
  }
});

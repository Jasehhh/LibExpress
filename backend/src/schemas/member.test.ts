import { test } from "node:test";
import assert from "node:assert/strict";
import { createMemberSchema, updateMemberSchema } from "./member";

test("create member needs first and last name", () => {
  assert.equal(
    createMemberSchema.safeParse({
      email: "ana@lib.com",
      first_name: "Ana",
      last_name: "Cruz",
    }).success,
    true,
  );
  assert.equal(
    createMemberSchema.safeParse({
      email: "ana@lib.com",
      full_name: "Ana Cruz",
    }).success,
    false,
  );
});

test("update member accepts a new last name", () => {
  const result = updateMemberSchema.safeParse({ last_name: "Reyes" });
  assert.equal(result.success, true);
  assert.equal(result.data?.last_name, "Reyes");
});

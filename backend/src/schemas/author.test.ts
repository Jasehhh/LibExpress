import { test } from "node:test";
import assert from "node:assert/strict";
import { authorBodySchema, authorPatchSchema } from "./author";

test("author body needs first and last name", () => {
  assert.equal(
    authorBodySchema.safeParse({ first_name: "Frank", last_name: "Herbert" })
      .success,
    true,
  );
  assert.equal(
    authorBodySchema.safeParse({ first_name: "", last_name: "Herbert" })
      .success,
    false,
  );
  assert.equal(
    authorBodySchema.safeParse({ first_name: "Frank" }).success,
    false,
  );
});

test("author patch accepts one field but not none", () => {
  assert.equal(
    authorPatchSchema.safeParse({ last_name: "Herbert" }).success,
    true,
  );
  assert.equal(authorPatchSchema.safeParse({}).success, false);
});

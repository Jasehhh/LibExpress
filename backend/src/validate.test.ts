import { test } from "node:test";
import assert from "node:assert/strict";
import type { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { validateResource } from "./validate";
import { authBodySchema } from "./schemas/auth";
import { updateMemberSchema } from "./schemas/member";

function run(schema: ZodType, body: unknown) {
  const out = { status: 0, json: undefined as unknown, nextCalled: false };
  const res = {
    status(code: number) {
      out.status = code;
      return this;
    },
    json(payload: unknown) {
      out.json = payload;
      return this;
    },
  };
  validateResource(schema)(
    { body } as unknown as Request,
    res as unknown as Response,
    (() => {
      out.nextCalled = true;
    }) as NextFunction,
  );
  return out;
}

test("valid body calls next", () => {
  const out = run(authBodySchema, { email: "a@b.com", password: "secret1" });
  assert.equal(out.nextCalled, true);
  assert.equal(out.status, 0);
});

test("invalid body returns 400 with field paths", () => {
  const out = run(authBodySchema, { email: "nope", password: "secret1" });
  assert.equal(out.nextCalled, false);
  assert.equal(out.status, 400);
  const json = out.json as { error: string; details: { path: string }[] };
  assert.equal(json.error, "Validation failed.");
  assert.deepEqual(
    json.details.map((d) => d.path),
    ["email"],
  );
});

test("missing body returns 400", () => {
  const out = run(authBodySchema, undefined);
  assert.equal(out.status, 400);
});

// Zod 4 applies .default() inside .partial(), so {} parses as
// { role: "USER", status: "ACTIVE" }. Validation passes and the PATCH handler
// itself answers 400 "No fields provided to update" because req.body is unchanged.
test("member update schema lets an empty object through to the handler", () => {
  const out = run(updateMemberSchema, {});
  assert.equal(out.nextCalled, true);
});

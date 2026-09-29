import { test } from "node:test";
import assert from "node:assert/strict";
import type { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import {
  isForeignKeyViolation,
  isUuid,
  uuidParam,
  validateResource,
} from "./validate";
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

test("isUuid accepts UUIDs and rejects anything else", () => {
  assert.equal(isUuid("3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b"), true);
  assert.equal(isUuid("3F2B8C1E-9A4D-4E6F-8B7A-1C2D3E4F5A6B"), true);
  assert.equal(isUuid("123"), false);
  assert.equal(isUuid("3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b-x"), false);
});

test("uuidParam answers 404 for a non-UUID id and passes a UUID on", () => {
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
  const next = (() => {
    out.nextCalled = true;
  }) as NextFunction;
  const handler = uuidParam("Book not found");

  handler({} as Request, res as unknown as Response, next, "abc");
  assert.equal(out.status, 404);
  assert.deepEqual(out.json, { error: "Book not found" });
  assert.equal(out.nextCalled, false);

  handler(
    {} as Request,
    res as unknown as Response,
    next,
    "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b",
  );
  assert.equal(out.nextCalled, true);
});

test("isForeignKeyViolation matches only Postgres code 23503", () => {
  assert.equal(isForeignKeyViolation({ code: "23503" }), true);
  assert.equal(isForeignKeyViolation({ code: "23505" }), false);
  assert.equal(isForeignKeyViolation(new Error("x")), false);
  assert.equal(isForeignKeyViolation(null), false);
});
import { test } from "node:test";
import assert from "node:assert/strict";
import { bookBodySchema } from "./book";

const book = {
  isbn: "9780441013593",
  title: "Dune",
  author_id: "22222222-2222-4222-8222-222222222222",
  url: "https://relay.example.com/files/cover.png",
  genre: "SCIFI",
  total_copies: 3,
};

test("book body takes author_id and url", () => {
  assert.equal(bookBodySchema.safeParse(book).success, true);
});

test("book body rejects an author name instead of an id", () => {
  const { author_id, ...rest } = book;
  assert.equal(
    bookBodySchema.safeParse({ ...rest, author: "Frank Herbert" }).success,
    false,
  );
  assert.equal(
    bookBodySchema.safeParse({ ...book, author_id: "frank" }).success,
    false,
  );
});

test("book url must be a url when given", () => {
  assert.equal(
    bookBodySchema.safeParse({ ...book, url: "not a url" }).success,
    false,
  );
});

test("book description is optional and capped at 2000 characters", () => {
  assert.equal(bookBodySchema.safeParse(book).success, true);
  const withDescription = bookBodySchema.safeParse({
    ...book,
    description: "A desert planet and its spice.",
  });
  assert.equal(withDescription.success, true);
  assert.equal(
    withDescription.data?.description,
    "A desert planet and its spice.",
  );
  assert.equal(
    bookBodySchema.safeParse({ ...book, description: "x".repeat(2001) })
      .success,
    false,
  );
});

-- Stop storing values that can be worked out from other rows.
-- Each step copies what it needs before the old column goes.

-- admin.created_at: not null and timestamptz like every other table.
UPDATE "admin" SET "created_at" = CURRENT_TIMESTAMP WHERE "created_at" IS NULL;
ALTER TABLE "admin" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6);

-- book.author_id becomes the book_author link table (books can have co-authors).
CREATE TABLE "book_author" (
    "book_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,

    CONSTRAINT "book_author_pkey" PRIMARY KEY ("book_id","author_id")
);
INSERT INTO "book_author" ("book_id", "author_id")
SELECT "id", "author_id" FROM "book";

CREATE INDEX "book_author_author_id_idx" ON "book_author"("author_id");
ALTER TABLE "book_author" ADD CONSTRAINT "book_author_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "book_author" ADD CONSTRAINT "book_author_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "book" DROP CONSTRAINT "book_author_id_fkey";
ALTER TABLE "book" DROP COLUMN "author_id",
DROP COLUMN "available_copies";

-- member: role duplicated the admin table; the counters are derived.
ALTER TABLE "member" DROP COLUMN "active_loans_count",
DROP COLUMN "role",
DROP COLUMN "unpaid_fines_total";

-- loan.status: returned means return_date is set.
UPDATE "loan" SET "return_date" = "due_date"
WHERE "status" = 'RETURNED' AND "return_date" IS NULL;
UPDATE "loan" SET "return_date" = NULL
WHERE "status" <> 'RETURNED' AND "return_date" IS NOT NULL;
ALTER TABLE "loan" DROP COLUMN "status";

CREATE INDEX "loan_book_id_idx" ON "loan"("book_id");
CREATE INDEX "loan_member_id_idx" ON "loan"("member_id");

-- fine.payment_status: paid means paid_at is set. fine.member_id is the loan's member.
UPDATE "fine" SET "paid_at" = "created_at"
WHERE "payment_status" = 'PAID' AND "paid_at" IS NULL;
UPDATE "fine" SET "paid_at" = NULL
WHERE "payment_status" = 'UNPAID' AND "paid_at" IS NOT NULL;

ALTER TABLE "fine" DROP CONSTRAINT "fine_member_id_fkey";
ALTER TABLE "fine" DROP COLUMN "member_id",
DROP COLUMN "payment_status";

-- A loan is returned once, so it gets at most one fine.
CREATE UNIQUE INDEX "fine_loan_id_key" ON "fine"("loan_id");

DROP TYPE "member_role";
DROP TYPE "loan_status";
DROP TYPE "payment_status";

-- Rules Prisma can't express in the schema.
ALTER TABLE "book" ADD CONSTRAINT "book_total_copies_check" CHECK ("total_copies" >= 0);
ALTER TABLE "loan" ADD CONSTRAINT "loan_dates_check"
    CHECK ("due_date" >= "checkout_date" AND ("return_date" IS NULL OR "return_date" >= "checkout_date"));
ALTER TABLE "fine" ADD CONSTRAINT "fine_amount_check" CHECK ("amount" > 0);

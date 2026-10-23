CREATE TABLE "book_copy" (
    "book_id" UUID NOT NULL,
    "copy_no" INTEGER NOT NULL,
    "acquired_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawn_at" TIMESTAMPTZ(6),

    CONSTRAINT "book_copy_pkey" PRIMARY KEY ("book_id","copy_no"),
    CONSTRAINT "book_copy_copy_no_check" CHECK ("copy_no" > 0)
);

ALTER TABLE "book_copy" ADD CONSTRAINT "book_copy_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

WITH "counts" AS (
    SELECT
        b."id",
        b."created_at",
        GREATEST(b."total_copies", COUNT(l."id") FILTER (WHERE l."return_date" IS NULL)) AS "in_circulation",
        GREATEST(
            b."total_copies",
            COUNT(l."id") FILTER (WHERE l."return_date" IS NULL),
            CASE WHEN COUNT(l."id") > 0 THEN 1 ELSE 0 END
        ) AS "copies"
    FROM "book" b
    LEFT JOIN "loan" l ON l."book_id" = b."id"
    GROUP BY b."id"
)
INSERT INTO "book_copy" ("book_id", "copy_no", "acquired_at", "withdrawn_at")
SELECT c."id", n, c."created_at", CASE WHEN n > c."in_circulation" THEN CURRENT_TIMESTAMP END
FROM "counts" c, generate_series(1, c."copies") AS n;

ALTER TABLE "loan" ADD COLUMN "copy_no" INTEGER;

UPDATE "loan" l SET "copy_no" = o."n"
FROM (
    SELECT "id", ROW_NUMBER() OVER (PARTITION BY "book_id" ORDER BY "checkout_date", "id") AS "n"
    FROM "loan"
    WHERE "return_date" IS NULL
) o
WHERE l."id" = o."id";

UPDATE "loan" SET "copy_no" = 1 WHERE "copy_no" IS NULL;

ALTER TABLE "loan" ALTER COLUMN "copy_no" SET NOT NULL;

ALTER TABLE "loan" DROP CONSTRAINT "loan_book_id_fkey";
DROP INDEX "loan_book_id_idx";
CREATE INDEX "loan_book_id_copy_no_idx" ON "loan"("book_id", "copy_no");
ALTER TABLE "loan" ADD CONSTRAINT "loan_book_id_copy_no_fkey" FOREIGN KEY ("book_id", "copy_no") REFERENCES "book_copy"("book_id", "copy_no") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "loan_open_copy_key" ON "loan"("book_id", "copy_no") WHERE "return_date" IS NULL;

ALTER TABLE "book" DROP COLUMN "total_copies";

INSERT INTO "admin" ("email", "password_hash")
SELECT DISTINCT l."admin_email", ''
FROM "activity_log" l
WHERE l."admin_id" IS NULL AND l."admin_email" IS NOT NULL
ON CONFLICT ("email") DO NOTHING;

UPDATE "activity_log" l SET "admin_id" = a."id"
FROM "admin" a
WHERE l."admin_id" IS NULL AND l."admin_email" = a."email";

ALTER TABLE "activity_log" DROP COLUMN "admin_email";
ALTER TABLE "activity_log" DROP CONSTRAINT "activity_log_admin_id_fkey";
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

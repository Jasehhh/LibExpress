BEGIN;
-- The loan route enforces the limit. Members may already hold more than 5
-- open loans (overdue ones were not counted before), so the recount below
-- must not be capped.
ALTER TABLE member DROP CONSTRAINT IF EXISTS member_active_loans_count_check;
UPDATE member
SET active_loans_count = (
        SELECT COUNT(*)
        FROM loan
        WHERE loan.member_id = member.id
            AND loan.status IN ('ACTIVE', 'OVERDUE')
    );
COMMIT;

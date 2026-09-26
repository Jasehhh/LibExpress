ALTER TABLE fine
    RENAME COLUMN status TO payment_status;
ALTER TABLE fine
ADD COLUMN member_id UUID REFERENCES member(id) ON DELETE RESTRICT;
UPDATE fine
SET member_id = loan.member_id
FROM loan
WHERE fine.loan_id = loan.id;
ALTER TABLE fine
ALTER COLUMN member_id SET NOT NULL;

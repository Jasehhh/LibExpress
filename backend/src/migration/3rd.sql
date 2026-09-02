ALTER TABLE book
ADD COLUMN url TEXT;
CREATE TABLE admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE book DROP COLUMN url;
ALTER TABLE book
ADD COLUMN file_id TEXT;
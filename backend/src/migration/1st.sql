CREATE TYPE book_genre AS ENUM (
    'FANTASY',
    'SCIFI',
    'HORROR',
    'ROMANCE',
    'MYSTERY',
    'THRILLER',
    'ADVENTURE',
    'DRAMA',
    'COMEDY',
    'OTHERS'
);
CREATE TABLE book (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    isbn VARCHAR(13) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    genre book_genre NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TYPE member_status AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE member_role AS ENUM ('USER', 'ADMIN');
CREATE TABLE member (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role member_role NOT NULL DEFAULT 'USER',
    status member_status NOT NULL DEFAULT 'ACTIVE',
    active_loans_count INTEGER NOT NULL DEFAULT 0 CHECK (active_loans_count <= 5),
    unpaid_fines_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TYPE loan_status AS ENUM ('ACTIVE', 'RETURNED', 'OVERDUE');
CREATE TABLE loan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES book(id),
    member_id UUID NOT NULL REFERENCES member(id) ON DELETE RESTRICT,
    status loan_status NOT NULL DEFAULT 'ACTIVE',
    checkout_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_date TIMESTAMPTZ NOT NULL,
    return_date TIMESTAMPTZ
);
CREATE TYPE payment_status AS ENUM ('PAID', 'UNPAID');
CREATE TABLE fine (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loan(id),
    amount DECIMAL(10, 2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'UNPAID',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
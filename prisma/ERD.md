# LibExpress table diagram

Matches `prisma/schema.prisma` after the `2_book_copies` migration. This is the
relational schema (tables and foreign keys). The ER diagram in Silberschatz
notation is `docs/er-diagram.drawio`, explained in `docs/database-design.md`.

```mermaid
erDiagram
    author ||--o{ book_author : "writes"
    book ||--|{ book_author : "written by"
    book ||--o{ book_copy : "has copy"
    book_copy ||--o{ loan : "lent as"
    member ||--o{ loan : "borrows"
    loan ||--o| fine : "may incur"
    admin |o--o{ activity_log : "performs"

    admin {
        uuid id PK
        text email UK
        text password_hash
        timestamptz created_at
    }

    author {
        uuid id PK
        text first_name
        text last_name
    }

    book {
        uuid id PK
        varchar(13) isbn UK
        varchar(255) title
        text description "nullable"
        text url "nullable"
        book_genre genre
        timestamptz created_at
    }

    book_copy {
        uuid book_id PK, FK "on delete cascade"
        int4 copy_no PK "check > 0"
        timestamptz acquired_at
        timestamptz withdrawn_at "nullable, null = in circulation"
    }

    book_author {
        uuid book_id PK, FK "on delete cascade"
        uuid author_id PK, FK
    }

    member {
        uuid id PK
        varchar(255) email UK
        text first_name
        text last_name
        member_status status "ACTIVE or SUSPENDED"
        timestamptz created_at
    }

    loan {
        uuid id PK
        uuid book_id FK "with copy_no"
        int4 copy_no FK "with book_id"
        uuid member_id FK
        timestamptz checkout_date
        timestamptz due_date "check >= checkout_date"
        timestamptz return_date "nullable, null = still out"
    }

    fine {
        uuid id PK
        uuid loan_id FK, UK "one fine per loan"
        numeric(10_2) amount "check > 0"
        timestamptz paid_at "nullable, null = unpaid"
        timestamptz created_at
    }

    activity_log {
        uuid id PK
        uuid admin_id FK "nullable, null = system"
        activity_action action "CREATE, UPDATE, DELETE"
        activity_entity entity "book, member, loan, fine, author"
        uuid entity_id "nullable, no FK"
        jsonb details "nullable"
        timestamptz created_at
    }
```

Foreign keys are `ON DELETE RESTRICT` unless marked otherwise.
`numeric(10_2)` stands for `numeric(10,2)`, because Mermaid doesn't allow commas
in type names.

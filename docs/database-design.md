# LibExpress database design

The ER diagram, the relational schema built from it, and what changed in the
API to match. The diagram itself is [`er-diagram.drawio`](er-diagram.drawio)
(open it at [app.diagrams.net](https://app.diagrams.net) or with the draw.io
VS Code extension). It uses the notation from *Database System Concepts*
(Silberschatz, Korth, Sudarshan).

## What changed from the previous schema

| Change | Why |
| --- | --- |
| New weak entity `book_copy`, owned by `book`, discriminator `copy_no` | A loan is for one physical copy, not a title. |
| `book.total_copies` column removed | It's the number of copies a book has, so it's derived now. |
| `loan.book_id` → `loan(book_id, copy_no)`, a foreign key to `book_copy` | A loan points at the copy that was lent. |
| `activity_log.admin_email` removed | It repeated `admin.email`. The API joins to `admin` for it. |
| `activity_log.admin_id`: `ON DELETE SET NULL` → `ON DELETE RESTRICT` | Without the email copy, an entry would lose its admin if the admin were deleted. |

Everything else (tables, column names, enums, checks) is unchanged.

## ER diagram

### Notation

| Symbol | Meaning |
| --- | --- |
| Rectangle with a header | Entity set; attributes listed below the name |
| Underlined attribute | Primary key |
| Dashed underline | Discriminator of a weak entity |
| Double rectangle / double diamond | Weak entity / its identifying relationship |
| Indented attributes under a name | Composite attribute |
| `{ attribute }` | Multivalued attribute (none in this design) |
| `attribute ( )` | Derived attribute |
| Diamond | Relationship set |
| Arrow into an entity | "One" side: each related entity is linked to at most one of it |
| Plain line | "Many" side |
| Double line | Total participation: every entity takes part |

### Entities

| Entity | Attributes (PK first) |
| --- | --- |
| **admin** | <ins>id</ins>, email, password_hash, created_at |
| **author** | <ins>id</ins>, name (first_name, last_name) |
| **book** | <ins>id</ins>, isbn, title, description, url, genre, created_at, total_copies( ), available_copies( ) |
| **book_copy** (weak, owner `book`) | copy_no *(discriminator, dashed underline)*, acquired_at, withdrawn_at |
| **member** | <ins>id</ins>, email, name (first_name, last_name), status, created_at, active_loans_count( ), unpaid_fines_total( ) |
| **loan** | <ins>id</ins>, checkout_date, due_date, return_date, status( ) |
| **fine** | <ins>id</ins>, amount, paid_at, created_at, payment_status( ) |
| **activity_log** | <ins>id</ins>, action, entity, entity_id, details, created_at |

Derived attributes and how they're worked out:

- `book.total_copies`: the book's copies with no `withdrawn_at`
- `book.available_copies`: those copies minus the ones on an open loan
- `member.active_loans_count`: the member's loans with no `return_date`
- `member.unpaid_fines_total`: sum of `amount` over the member's fines with no `paid_at`
- `loan.status`: `RETURNED` if `return_date` is set, else `OVERDUE` once `due_date` has passed, else `ACTIVE`
- `fine.payment_status`: `PAID` if `paid_at` is set, else `UNPAID`

### Relationships

| Relationship | Between | Cardinality | Participation |
| --- | --- | --- | --- |
| **writes** | author, book | many-to-many | book total (every book has an author), author partial |
| **copy_of** (identifying) | book_copy, book | many-to-one (arrow to book) | book_copy total, book partial |
| **lent_as** | loan, book_copy | many-to-one (arrow to book_copy) | loan total, book_copy partial |
| **borrows** | loan, member | many-to-one (arrow to member) | loan total, member partial |
| **incurs** | loan, fine | one-to-one (arrows both ways) | fine total, loan partial |
| **performs** | activity_log, admin | many-to-one (arrow to admin) | both partial |

No relationship has descriptive attributes. A loan's dates belong to the loan
entity, since a member can borrow the same copy more than once. There are no
recursive relationships, so no role names. ISA and aggregation aren't used: no
entity set is a special case of another, and no relationship has to take part in
another relationship.

### Assumptions

1. **A loan is an entity, not a relationship between member and book_copy.** The
   same member can borrow the same copy many times, and a fine hangs off a single
   loan, so a loan needs its own identity.
2. **A book copy only exists as a copy of a book.** Copy numbers start at 1 for
   each book, so `copy_no` alone doesn't identify a copy. Together with the book
   it does, which makes `book_copy` a weak entity.
3. **Copies are withdrawn, not deleted.** A copy that's been lent has loan history
   that must stay, so lowering a book's copy count sets `withdrawn_at` on copies
   that are on the shelf. Withdrawn copies can't be lent and don't count toward
   `total_copies`.
4. **A loan has at most one fine**, created when the loan is returned late. A fine
   always belongs to a loan. The member who owes it is the loan's member, so the
   fine doesn't link to member directly.
5. **A fine's amount is stored, not derived**, even though it's worked out from
   the loan's dates at 20.00 per day late. It's what was charged at the rate in
   force on the day, so changing the rate later doesn't rewrite old fines.
6. **Every book has at least one author.** An author can exist with no books yet.
7. **`activity_log.entity` and `entity_id` are a historical record, not a link.**
   They name the row that was changed, which may since have been deleted, so they
   aren't drawn as relationships and have no foreign key.
8. **An activity log entry with no admin was made by the system.** The old nightly
   overdue job wrote entries like that, so `performs` is partial on the log's side.
9. **No multivalued attributes.** A book's authors are a relationship, not a
   multivalued attribute of book.
10. **Admins are staff accounts only.** Members don't sign in, so admin and member
    aren't a specialization of a common "person" entity.

## Relational schema

PKs are listed first and underlined, FKs are in *italics* with what they point
to. Every column is `NOT NULL` unless marked *nullable*.

**admin** (<ins>id</ins>, email, password_hash, created_at)

**author** (<ins>id</ins>, first_name, last_name)

**book** (<ins>id</ins>, isbn, title, description, url, genre, created_at)

**book_copy** (<ins>*book_id*</ins>, <ins>copy_no</ins>, acquired_at, withdrawn_at)
- `book_id` → book(id), on delete cascade

**book_author** (<ins>*book_id*</ins>, <ins>*author_id*</ins>)
- `book_id` → book(id), on delete cascade
- `author_id` → author(id)

**member** (<ins>id</ins>, email, first_name, last_name, status, created_at)

**loan** (<ins>id</ins>, *book_id*, *copy_no*, *member_id*, checkout_date, due_date, return_date)
- `(book_id, copy_no)` → book_copy(book_id, copy_no)
- `member_id` → member(id)

**fine** (<ins>id</ins>, *loan_id*, amount, paid_at, created_at)
- `loan_id` → loan(id), unique

**activity_log** (<ins>id</ins>, *admin_id*, action, entity, entity_id, details, created_at)
- `admin_id` → admin(id)

Foreign keys are `ON DELETE RESTRICT` unless marked otherwise.

### How each table comes from the diagram

| Diagram | Table |
| --- | --- |
| Strong entities admin, author, book, member, loan, fine, activity_log | One table each. Composite `name` split into `first_name`, `last_name`. Derived attributes are dropped. |
| Weak entity book_copy | `book_copy` with the owner's key `book_id` + discriminator `copy_no` as the PK |
| copy_of (identifying) | No table. It's the `book_id` in `book_copy`. |
| writes (many-to-many) | `book_author`, PK = both entities' keys |
| lent_as, borrows (many-to-one, loan total) | Merged into `loan` as FKs `(book_id, copy_no)` and `member_id`, NOT NULL |
| incurs (one-to-one, fine total) | Merged into `fine` as FK `loan_id`, NOT NULL and unique |
| performs (many-to-one, partial) | Merged into `activity_log` as FK `admin_id`, nullable |

### Columns

| Table | Column | Type | Constraints |
| --- | --- | --- | --- |
| admin | id | uuid | PK, default `gen_random_uuid()` |
| | email | text | unique |
| | password_hash | text | |
| | created_at | timestamptz | default now |
| author | id | uuid | PK |
| | first_name | text | |
| | last_name | text | |
| book | id | uuid | PK |
| | isbn | varchar(13) | unique |
| | title | varchar(255) | |
| | description | text | nullable |
| | url | text | nullable, cover image URL |
| | genre | book_genre | enum: FANTASY, SCIFI, HORROR, ROMANCE, MYSTERY, THRILLER, ADVENTURE, DRAMA, COMEDY, OTHERS |
| | created_at | timestamptz | default now |
| book_copy | book_id | uuid | PK, FK |
| | copy_no | int4 | PK, check `> 0` |
| | acquired_at | timestamptz | default now |
| | withdrawn_at | timestamptz | nullable, null = in circulation |
| book_author | book_id | uuid | PK, FK |
| | author_id | uuid | PK, FK, indexed |
| member | id | uuid | PK |
| | email | varchar(255) | unique |
| | first_name | text | |
| | last_name | text | |
| | status | member_status | enum: ACTIVE, SUSPENDED; default ACTIVE |
| | created_at | timestamptz | default now |
| loan | id | uuid | PK |
| | book_id | uuid | FK (with copy_no), indexed |
| | copy_no | int4 | FK (with book_id) |
| | member_id | uuid | FK, indexed |
| | checkout_date | timestamptz | default now |
| | due_date | timestamptz | check `>= checkout_date` |
| | return_date | timestamptz | nullable, null = still out; check `>= checkout_date` |
| fine | id | uuid | PK |
| | loan_id | uuid | FK, unique |
| | amount | numeric(10,2) | check `> 0` |
| | paid_at | timestamptz | nullable, null = unpaid |
| | created_at | timestamptz | default now |
| activity_log | id | uuid | PK |
| | admin_id | uuid | FK, nullable (null = system) |
| | action | activity_action | enum: CREATE, UPDATE, DELETE |
| | entity | activity_entity | enum: book, member, loan, fine, author |
| | entity_id | uuid | nullable, no FK (assumption 7) |
| | details | jsonb | nullable |
| | created_at | timestamptz | default now, indexed descending |

### Functional dependencies and normal form

A table is in BCNF when the left side of every non-trivial FD is a superkey. For
each table below, the listed FDs are all the non-trivial ones that hold, and every
left side is a candidate key, so **every table is in BCNF** (and so also 3NF).

| Table | FDs | Candidate keys |
| --- | --- | --- |
| admin | id → email, password_hash, created_at<br>email → id, password_hash, created_at | {id}, {email} |
| author | id → first_name, last_name | {id} (two authors can share a name) |
| book | id → isbn, title, description, url, genre, created_at<br>isbn → id, title, description, url, genre, created_at | {id}, {isbn} |
| book_copy | book_id, copy_no → acquired_at, withdrawn_at | {book_id, copy_no} |
| book_author | none (all-key table) | {book_id, author_id} |
| member | id → email, first_name, last_name, status, created_at<br>email → id, first_name, last_name, status, created_at | {id}, {email} |
| loan | id → book_id, copy_no, member_id, checkout_date, due_date, return_date | {id} |
| fine | id → loan_id, amount, paid_at, created_at<br>loan_id → id, amount, paid_at, created_at | {id}, {loan_id} |
| activity_log | id → admin_id, action, entity, entity_id, details, created_at | {id} |

Why some FDs you might expect don't hold:

- **loan: `copy_no` alone doesn't determine `book_id`.** Every book has a copy 1,
  so `copy_no` is only unique within a book. The FK is the pair.
- **loan: `member_id` doesn't determine anything else.** A member has many loans.
- **fine: `amount` isn't determined by another column in `fine`.** It's worked out
  from the loan's dates when the fine is made (assumption 5), and those live in
  `loan`, so there's no FD inside this table.
- **No table stores a value derived from other rows.** That's why `total_copies`,
  `available_copies`, the member totals, loan status and payment status are
  computed when read.
- **There's no nightly overdue job.** It used to set a stored `loan.status` to
  `OVERDUE`. That column was a derived value (it depends on `due_date` and
  `return_date`, not on the key alone), so it's gone, and a loan reads as
  `OVERDUE` the moment its due date passes.

## Rules the API enforces

The database can't express these as constraints, so the routers check them inside
a transaction, with row locks so two requests can't both pass a check:

- A book has at least one author.
- A member can have at most 5 open loans.
- A member owing more than 100.00 in unpaid fines can't borrow.
- A suspended member can't borrow.
- A withdrawn copy can't be lent, and a copy on loan can't be withdrawn.
- A copy can only be on one open loan at a time.

## API changes

Every procedure keeps its name and input. What changed:

| Procedure | Change |
| --- | --- |
| `book.create` | `totalCopies: n` creates copies 1..n. |
| `book.update` | `totalCopies` raises the count by adding copies (numbered after the highest existing one) or lowers it by withdrawing copies that are on the shelf, highest number first. Fails if there aren't enough copies on the shelf. |
| `book.*` outputs | Still return `totalCopies` and `availableCopies`, now counted from the copies. |
| `loan.create` | Still takes `memberId` + `bookId`. The server lends the lowest-numbered copy that's in circulation and on the shelf. |
| `loan.*` outputs | Gain `copyNo`. |
| `activity.list` | Rows still have `adminEmail`, now read from the `admin` row (null for system entries). |
| `book.delete`, `member.delete` | Same errors as before, now checked up front: active loans → `BAD_REQUEST`, loan history → `CONFLICT`. |

## Migration

`prisma/migrations/2_book_copies/migration.sql` changes an existing database in place:

1. Creates `book_copy` and gives every book copies 1..`total_copies`.
2. Adds `loan.copy_no` and assigns each loan a copy of its book. Open loans get
   distinct copies, and returned loans go on copy 1. If a book has more open loans
   than copies, extra copies are made first. A book with no copies but past loans
   gets one copy, marked withdrawn, to hold that history.
3. Points `loan` at `book_copy` with the composite FK and drops the old
   `loan.book_id` → `book` FK.
4. Drops `book.total_copies` and `activity_log.admin_email`, and changes the
   `activity_log.admin_id` FK to `ON DELETE RESTRICT`.

Run it with `npm run db:migrate`.

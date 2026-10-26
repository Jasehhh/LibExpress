# LibExpress

A streamlined library management application built to handle everyday library operations — managing book catalogs, processing checkouts and returns, and tracking availability in real time.

## Features

- Public book catalogue with cover images, descriptions and authors
- Book, author and member management
- Checkout & return processing, with automatic late fines (20.00 per day late)
- Loans show as overdue the moment they pass their due date
- Activity log of every staff change, for the owner to review
- Cover image upload through the Relay file service
- Staff sign-in with NextAuth (email and password)

## Tech Stack

Built on the [T3 Stack](https://create.t3.gg/):

- [Next.js](https://nextjs.org/) — React framework, pages and API routes
- [tRPC](https://trpc.io/) — typed API between the server and the frontend
- [Prisma](https://www.prisma.io/) — PostgreSQL schema, migrations and queries
- [NextAuth.js](https://authjs.dev/) — staff sign-in (credentials provider, JWT sessions)
- [Zod](https://zod.dev/) — input validation, shared by the API and forms
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [bcryptjs](https://www.npmjs.com/package/bcryptjs) — password hashing

**Language**: TypeScript

## Project Structure

```
docs/
├── database-design.md    # ER diagram notes, relational schema, FDs and BCNF
└── er-diagram.drawio     # ER diagram and relational schema (open in draw.io)

prisma/
├── schema.prisma         # Database schema (tables keep the old snake_case names)
└── migrations/           # Prisma migrations

public/                   # Static files served from the site root (logo, hero art)

src/
├── app/
│   ├── (admin)/          # Staff pages: login, forgot password, dashboard, catalog, members, transactions
│   ├── @modal/           # Book modal shown over the catalog
│   ├── books/[id]/       # Book page
│   ├── page.tsx          # Public catalog
│   ├── api/auth/         # NextAuth routes (sign in, sign out)
│   ├── api/trpc/         # tRPC endpoint
│   └── api/relay/upload/ # Book cover upload to Relay
├── components/
│   ├── admin/            # Staff-only pieces: login form, sidebar, dashboard panels
│   ├── features/         # Components for one resource (authors, books, fines, loans, members)
│   └── ui/               # Shared pieces: site header, hero, book modal, dialog, form fields
├── lib/
│   ├── schemas/          # Zod inputs, usable in forms too
│   ├── types.ts          # Frontend types, inferred from the routers
│   └── relay.ts          # uploadImage() for the browser
├── server/
│   ├── api/routers/      # One tRPC router per resource
│   ├── auth/             # NextAuth config
│   └── lib/              # Activity log, row locks, derived values and Relay helpers
└── env.js                # Environment variable validation
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- A PostgreSQL database

### Setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill it in:

```env
AUTH_SECRET=        # generate with: npx auth secret
DATABASE_URL=postgresql://user:password@localhost:5432/libexpress
RELAY_URL=          # optional, for cover uploads
RELAY_API_KEY=      # optional
```

Create the tables on an empty database:

```bash
npx prisma migrate deploy
```

If the database was built with the old SQL migrations (`1st.sql` → `9th.sql`), mark the first migration as already applied instead:

```bash
npx prisma migrate resolve --applied 0_init
```

then run `npx prisma migrate deploy` to apply the rest.

Start the app:

```bash
npm run dev
```

The app is at `http://localhost:3000`. There is no sign-up: only accounts seeded into the database can sign in. Seed the staff account with `npm run create-admin -- <email> <password>` (it writes to the `DATABASE_URL` in `.env`), then sign in at `/api/auth/signin`.

## API

The API is tRPC, at `/api/trpc`. From a client component call it with `api.<router>.<procedure>.useQuery()` or `.useMutation()`; from a server component use `api` from `~/trpc/server`. "Signed in" procedures need a NextAuth session. Every create, update and delete by a signed-in user is recorded in the activity log.

| Router | Procedures | Access |
|---|---|---|
| `book` | `getAll`, `getById` (include `authors`) | Public |
| `book` | `create`, `update`, `delete` | Signed in |
| `author` | `getAll`, `getById` | Public |
| `author` | `create`, `update`, `delete` | Signed in |
| `member` | `getAll`, `getById`, `create`, `update`, `delete` | Signed in |
| `loan` | `getAll`, `getById`, `getByMember`, `getOpen`, `getHistory({ memberId })`, `getTransactions`, `create` (checkout), `return` | Signed in |
| `fine` | `getAll`, `getById`, `getByMember`, `update` (paid / unpaid) | Signed in |
| `activity` | `list({ entity, entityId, adminId, limit, offset })` | Signed in |
| `dashboard` | `overview`, `activity`, `circulation`, `overdueLoans`, `popularBooks` | Signed in |

`update` procedures take `{ id, data }`, where `data` has only the fields to change.

Cover images go through `POST /api/relay/upload` (signed in, form field `file`, answers `{ url }`); `uploadImage(file)` in `src/lib/relay.ts` calls it.

Rules the API enforces:

- A member can have at most 5 loans out (active or overdue); loans are due after 14 days.
- Suspended members, and members with more than 100.00 in unpaid fines, can't check out books.
- Returning a book late creates a fine of 20.00 per day. Marking a fine paid sets `paidAt`.
- A book has one or more authors (`authorIds` on create and update). Each physical copy is a `book_copy` row. `totalCopies` counts the copies in circulation and `availableCopies` the ones not on loan. Lowering `totalCopies` withdraws copies on the shelf, and it can't go below the copies on loan. Checkout lends the lowest-numbered free copy and the loan records its `copyNo`.
- Copies on the shelf, a member's `activeLoansCount` and `unpaidFinesTotal`, a loan's `status` and a fine's `paymentStatus` aren't stored; the API works them out from the loans and fines each time. A loan is returned once it has a `returnDate`, overdue while open past its `dueDate`, and a fine is paid once it has a `paidAt`.
- Books, members and authors that are still in use (active loans, or books for an author) can't be deleted. Books and members with past loans or fines can't be deleted either (`CONFLICT`).
- Money (`unpaidFinesTotal`, `amount`) is sent as a string like `"20.00"`.
- The activity log can't be edited; `activity.list` returns `{ data, total }`, newest first, 50 per page by default (max 200).

## Team

| Role | Name |
|---|---|
| Frontend | Justin Jan Dalumpines |
| Frontend | Matthew Estilo |
| Backend | Nelson Lago III |

## License

This project is for educational/academic purposes. A final project for SE 2144 & SE 2141.

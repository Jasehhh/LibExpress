# LibExpress

A streamlined library management application built to handle everyday library operations — managing book catalogs, processing checkouts and returns, and tracking availability in real time.

## Features

- Public book catalogue with cover images, descriptions and authors
- Book, author and member management
- Checkout & return processing, with automatic late fines (20.00 per day late)
- Nightly job that marks late loans as overdue
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
- [node-cron](https://www.npmjs.com/package/node-cron) — nightly overdue check

**Language**: TypeScript

## Project Structure

```
prisma/
├── schema.prisma         # Database schema (tables keep the old snake_case names)
└── migrations/           # Prisma migrations

src/
├── app/
│   ├── api/auth/         # NextAuth routes (sign in, sign out)
│   ├── api/trpc/         # tRPC endpoint
│   └── api/relay/upload/ # Book cover upload to Relay
├── lib/
│   ├── context/          # AuthContext (NextAuth session) and LibraryContext reducers
│   ├── schemas/          # Zod inputs, usable in forms too
│   ├── types.ts          # Frontend types, inferred from the routers
│   └── relay.ts          # uploadImage() for the browser
├── server/
│   ├── api/routers/      # One tRPC router per resource
│   ├── auth/             # NextAuth config
│   ├── jobs/             # Overdue loan job
│   └── lib/              # Activity log, row locks, money and Relay helpers
├── instrumentation.ts    # Starts the nightly job when the server starts
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

Start the app:

```bash
npm run dev
```

The app is at `http://localhost:3000`. Create the first staff account with `auth.register` (it is open only while there are no accounts), then sign in at `/api/auth/signin`.

## API

The API is tRPC, at `/api/trpc`. From a client component call it with `api.<router>.<procedure>.useQuery()` or `.useMutation()`; from a server component use `api` from `~/trpc/server`. "Signed in" procedures need a NextAuth session. Every create, update and delete by a signed-in user is recorded in the activity log.

| Router | Procedures | Access |
|---|---|---|
| `auth` | `hasAccounts`, `register` | Public (`register` needs a session once an account exists) |
| `book` | `getAll`, `getById` (include `author`) | Public |
| `book` | `create`, `update`, `delete` | Signed in |
| `author` | `getAll`, `getById` | Public |
| `author` | `create`, `update`, `delete` | Signed in |
| `member` | `getAll`, `getById`, `create`, `update`, `delete` | Signed in |
| `loan` | `getAll`, `getById`, `getByMember`, `create` (checkout), `return` | Signed in |
| `fine` | `getAll`, `getById`, `getByMember`, `update` (paid / unpaid) | Signed in |
| `activity` | `list({ entity, entityId, adminId, limit, offset })` | Signed in |

`update` procedures take `{ id, data }`, where `data` has only the fields to change.

Cover images go through `POST /api/relay/upload` (signed in, form field `file`, answers `{ url }`); `uploadImage(file)` in `src/lib/relay.ts` calls it.

Rules the API enforces:

- A member can have at most 5 loans out (active or overdue); loans are due after 14 days.
- Suspended members, and members with more than 100.00 in unpaid fines, can't check out books.
- Returning a book late creates a fine of 20.00 per day. Marking a fine paid sets `paidAt`.
- Changing a book's total copies changes its available copies by the same amount; the total can't go below the copies on loan.
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

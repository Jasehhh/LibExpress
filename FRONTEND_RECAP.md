# LibExpress frontend recap

Branch: `feature/frontend-design` (pushed to origin)
Open a pull request: https://github.com/Jasehhh/LibExpress/pull/new/feature/frontend-design

The frontend builds cleanly, passes the TypeScript check and ESLint, and the main flows were tested in a browser against the real backend.

## How it follows the backend

- It stays on the existing stack (Next.js 16 App Router, Tailwind CSS 4), with one page per backend route group.
- The services in `src/app/api/*` keep their existing names. They now show the backend's real error messages, including its Zod validation errors, and there are new fetch-by-id calls for authors, members, loans and fines.
- The backend's Zod schemas are copied into `src/lib/schemas/`, so forms show the same error messages the API would return.
- Types match the API responses: amounts arrive as strings like `"20.00"` and dates as ISO strings.
- Loan rules (5 active loans, 14-day loans, 20.00 a day late) live in `src/lib/rules.ts`. The frontend uses them only for hints and previews; the API still decides.

## Pages

### Public

- `/`: the catalogue, with search by title, author or ISBN, genre filters, an "on the shelf now" filter, and availability for each book.
- `/books/[id]`: a page per book, laid out like an old library catalog card, with more books by the same author.

### Staff (at `/admin`; sign in at `/login` or create an account at `/register`)

- **Overview:** counts, what's due back next, recent changes, and the collection by genre.
- **Loans:** check out a book, which shows a stamped due-date slip. Return a book, which previews the late fine using the backend's formula (partial days count as a full day).
- **Books:** add, edit and remove books, upload covers, and add a new author from inside the book form.
- **Authors:** add, edit and remove authors.
- **Members:** add, edit and remove members. Each member has a page with their current loans, fines and loan history.
- **Fines:** amount still owed and amount collected, and marking each fine paid or unpaid.
- **Activity log:** filter by record type or show only your own changes, view the history of one record, and see before/after values for each change.

If the backend rejects a login token, the app signs the user out and tells them their session ended.

## How it was tested

- A throwaway local Postgres and a copy of the backend were used. The shared Neon database was not touched.
- In the browser: login and its validation, checkout, a late return that created a 140.00 fine, marking a fine paid, adding a book with a new author, the backend refusing to delete a book that is on loan, the member page, the activity log, the expired-session redirect, and mobile layout.
- The backend's own 25 tests pass.

## Git

- Four commits with plain messages and no Claude trailers.
- A new root `.gitignore` covers `CLAUDE.md`, `.claude/`, `docs/superpowers/` and `.playwright-mcp/`, and the stale `frontend/dist/` is now ignored. None of those files are tracked.
- `frontend/package-lock.json` was already modified before this work started and was left out of the commits.

## Choices you may want to change

- Fines are shown in Philippine pesos (₱). That is an assumption; it is one constant in `src/lib/format.ts`.
- The browser calls the API directly because the login token lives in the browser, so `BACKEND_URL` is built into the frontend at build time. Restart `npm run dev`, or rebuild, after changing it. The README now says this.

## Backend problems found (not fixed; this task was frontend only)

- **Anyone can create a staff account.** `POST /auth/register` is public, so any visitor can register and get full staff access. This is worth restricting.
- `member.active_loans_count` is never updated by the loan routes. The UI counts loans itself instead.
- Raising a book's total copies does not raise its available copies, so the extra copies can never be checked out.
- Deleting a book or member that has any past loans fails with a raw Postgres foreign-key error. The UI rewords that error into plain language.
- `fine.paid_at` is never set.
- The 5-loan limit counts only `ACTIVE` loans, not `OVERDUE` ones.
- `GET /book/:id` with an id that is not a UUID returns a 500 error. The UI checks the id before calling it.

## Local machine notes

- The repo is in iCloud-synced Documents, and iCloud created conflicting duplicates of some generated files in `frontend/.next`. They were deleted (they are gitignored).
- `backend/node_modules` is incomplete (`node-cron` is missing). Run `npm install` in `backend/` before starting the backend.
- A Next.js dev server was already running on port 3001 and was left alone.

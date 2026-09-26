# LibExpress

A streamlined library management application built to handle everyday library operations — managing book catalogs, processing checkouts and returns, and tracking availability in real time.

## Features

- Public book catalogue with cover images, descriptions and authors
- Book, author and member management
- Checkout & return processing, with automatic late fines (20.00 per day late)
- Nightly job that marks late loans as overdue
- Activity log of every staff change, for the owner to review
- Cover image upload through the Relay file service
- Staff authentication with JWT

## Tech Stack

**Frontend**
- [Next.js](https://nextjs.org/) — React framework
- [Tailwind CSS](https://tailwindcss.com/) — styling

**Backend**
- [Express](https://expressjs.com/) — REST API
- [Zod](https://zod.dev/) — schema validation
- [PostgreSQL](https://www.postgresql.org/) (`pg`) — database
- [JSON Web Token](https://github.com/auth0/node-jsonwebtoken) — authentication
- [bcrypt](https://www.npmjs.com/package/bcrypt) — password hashing
- [node-cron](https://www.npmjs.com/package/node-cron) — nightly overdue check
- [Multer](https://www.npmjs.com/package/multer) — image uploads

**Language**
- TypeScript

## Project Structure

```
backend/
├── src/
│   ├── index.ts          # Express app, route mounting, nightly cron job
│   ├── db.ts             # PostgreSQL connection pool
│   ├── authMiddleware.ts # JWT check for protected routes
│   ├── validate.ts       # Zod request body validation
│   ├── routes/           # One router per resource (book, author, member, loan, fine, activity, relay, auth)
│   ├── schemas/          # Zod schemas and their tests
│   ├── helper/           # Activity log helper, Relay file helper
│   ├── job/              # Overdue loan job
│   ├── type/             # Row types
│   └── migration/        # SQL migrations, run in order (1st.sql → 8th.sql)
└── package.json

frontend/
├── src/
│   ├── app/              # Next.js routes/pages
│   │   └── api/          # Services that call the backend (one per resource)
│   └── lib/
│       ├── client.ts     # apiFetch: adds the backend URL and token
│       ├── types/        # Types matching the backend responses
│       └── utils/        # Relay image upload helper
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- A PostgreSQL database
- `psql` (to run the migrations)

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/libexpress
JWT_SECRET=your_jwt_secret
PORT=4000
RELAY_URL=https://your-relay-service
RELAY_API_KEY=your_relay_api_key
```

Run the migrations in order (there is no migration runner; each file is plain SQL):

```bash
for f in 1st 2nd 3rd 4th 5th 6th 7th 8th; do
  psql "$DATABASE_URL" -f src/migration/$f.sql
done
```

Start the API (reloads on save):

```bash
npm run dev
```

Run the tests:

```bash
npm test
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`. The URL must end in `/api`:

```env
BACKEND_URL=http://localhost:4000/api
```

```bash
npm run dev
```

The app will be available at `http://localhost:3000`. The backend defaults to port 3000 as well, so set `PORT` in `backend/.env` (for example `4000`) when running both locally.

## API

All routes are under `/api`. Routes marked "Login" need an `Authorization: Bearer <token>` header from `/auth/login` or `/auth/register`. Every create, update and delete behind a login is recorded in the activity log.

| Resource | Endpoints | Access |
|---|---|---|
| Auth | `POST /auth/register`, `POST /auth/login` | Public |
| Books | `GET /book`, `GET /book/:id` (include `author`) | Public |
| Books | `POST /book`, `PATCH /book/:id`, `DELETE /book/:id` | Login |
| Authors | `GET /author`, `GET /author/:id` | Public |
| Authors | `POST /author`, `PATCH /author/:id`, `DELETE /author/:id` | Login |
| Members | `GET`, `POST`, `PATCH`, `DELETE` on `/member` | Login |
| Loans | `GET /loan`, `GET /loan/:id`, `GET /loan/member/:id`, `POST /loan`, `PATCH /loan/:id` (return) | Login |
| Fines | `GET /fine`, `GET /fine/:id`, `GET /fine/member/:id`, `PATCH /fine/:id` | Login |
| Activity log | `GET /activity?entity=&entity_id=&admin_id=&limit=&offset=` | Login |
| Image upload | `POST /relay/upload` (form field `file`, returns `{ url }`) | Login |

Rules the API enforces:

- A member can have at most 5 active loans; loans are due after 14 days.
- Returning a book late creates a fine of 20.00 per day.
- Books, members and authors that are still in use (active loans, or books for an author) can't be deleted.
- The activity log can't be edited; `GET /activity` returns `{ data, total }`, newest first, 50 per page by default (max 200).

## Team

| Role | Name |
|---|---|
| Frontend | Justin Jan Dalumpines |
| Frontend | Matthew Estilo |
| Backend | Nelson Lago III |

## License

This project is for educational/academic purposes. A final project for SE 2144 & SE 2141.

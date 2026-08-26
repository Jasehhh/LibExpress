# LibExpress

A streamlined library management application built to handle everyday library operations — managing book catalogs, processing checkouts and returns, and tracking availability in real time.

## Features

- Book catalog management (add, edit, remove, search)
- Checkout & return processing
- User/member management
- Authentication & role-based access (admin/staff/member)
- Real-time availability tracking

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

**Language**
- TypeScript

## Project Structure

```
src/
├── app/            # Next.js routes/pages
├── components/     # Reusable UI components
├── lib/            # Shared utilities, types, db config
├── modules/        # Feature modules (routes, controllers, services, validation)
├── middlewares/     # Express middlewares (auth, error handling)
└── migrations/      # Database migrations
```

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- PostgreSQL instance running locally or remotely

### Installation

```bash
git clone <repo-url>
cd libexpress
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/libexpress
JWT_SECRET=your_jwt_secret
```

### Run Migrations

```bash
npm run migrate
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Team

| Role | Name |
|---|---|
| Frontend | Justin Jan Dalumpines |
| Frontend | Matthew Estilo |
| Backend | Nelson Lago III |

## License

This project is for educational/academic purposes. A final project for SE 2144 & SE 2141.
import { Pool } from "pg";
import dotenv from "dotenv";

/* dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT) || 5432,
}); */

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

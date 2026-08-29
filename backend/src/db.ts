import { Pool } from "pg";
import dotenv from "dotenv";

/* dotenv.config();

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

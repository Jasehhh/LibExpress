import { NextFunction, Request, Response, Router } from "express";
import { pool } from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validateResource } from "../validate";
import { authBodySchema } from "../schemas/auth";
import { authenticateToken } from "../authMiddleware";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

router.post(
  "/login",
  validateResource(authBodySchema),
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
      const result = await pool.query(
        `SELECT id, email, password_hash 
      FROM admin 
      WHERE email = $1`,
        [email],
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials." });
      }

      const admin = result.rows[0];
      const passwordMatches = await bcrypt.compare(
        password,
        admin.password_hash,
      );

      if (!passwordMatches) {
        return res.status(401).json({ error: "Invalid credentials." });
      }

      const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, {
        expiresIn: "1d",
      });

      res.json({ token });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
);

// Only a signed-in user can add accounts. The very first account needs no
// token, otherwise nobody could ever sign in.
const requireTokenOnceSetUp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await pool.query(
      `SELECT EXISTS (SELECT 1 FROM admin) AS has_admin`,
    );
    if (!result.rows[0].has_admin) {
      return next();
    }
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
  authenticateToken(req, res, next);
};

router.post(
  "/register",
  requireTokenOnceSetUp,
  validateResource(authBodySchema),
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
      const existing = await pool.query(
        `SELECT id FROM admin WHERE email = $1`,
        [email],
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "Email already registered." });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `INSERT INTO admin (email, password_hash)
         VALUES ($1, $2)
         RETURNING id, email`,
        [email, passwordHash],
      );

      const admin = result.rows[0];

      const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, {
        expiresIn: "1d",
      });

      res.status(201).json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Something went wrong." });
    }
  },
);

export default router;

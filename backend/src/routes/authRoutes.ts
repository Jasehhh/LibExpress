import { Request, Response, Router } from "express";
import { pool } from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validateResource } from "../validate";
import { authBodySchema } from "../schemas/auth";

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

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

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
export default router;

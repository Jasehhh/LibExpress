import { Request, Response, Router } from "express";
import { pool } from "../db";
import { validateResource } from "../validate";
import { createMemberSchema, updateMemberSchema } from "../schemas/member";
import { authenticateToken } from "../authMiddleware";

const router = Router();

router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT *
      FROM member
      WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Member not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * 
      FROM member`,
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post(
  "/",
  authenticateToken,
  validateResource(createMemberSchema),
  async (req: Request, res: Response) => {
    const { email, full_name } = req.body;

    try {
      const foundCheck = await pool.query(
        `SELECT id FROM member WHERE email = $1`,
        [email],
      );
      if (foundCheck.rows.length > 0) {
        return res
          .status(409)
          .json({ error: "A member with this email already exists." });
      }

      const result = await pool.query(
        `INSERT INTO member (email, full_name,  role, status, active_loans_count, unpaid_fines_total)
         VALUES ($1, $2, 'USER', 'ACTIVE', 0, 0)
         RETURNING *`,
        [email, full_name],
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
);

router.patch(
  "/:id",
  authenticateToken,
  validateResource(updateMemberSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email, full_name, role, status } = req.body;

    const fields: Record<string, unknown> = {
      email,
      full_name,
      role,
      status,
    };

    const updates = Object.entries(fields).filter(([, v]) => v !== undefined);

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields provided to update" });
    }

    const setClause = updates
      .map(([key], i) => `${key} = $${i + 1}`)
      .join(", ");
    const values = updates.map(([, v]) => v);

    try {
      const result = await pool.query(
        `UPDATE member
              SET ${setClause}
              WHERE id = $${updates.length + 1}
              RETURNING *`,
        [...values, id],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Member not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
);

router.delete(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const activeLoanCheck = await pool.query(
        `SELECT id FROM loan WHERE member_id = $1 AND status IN ('ACTIVE', 'OVERDUE')`,
        [id],
      );
      if (activeLoanCheck.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Cannot delete a member with active loans" });
      }

      const result = await pool.query(
        `DELETE FROM member WHERE id = $1 RETURNING *`,
        [id],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Member not found" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
);

export default router;

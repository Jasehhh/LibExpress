import { Request, Response, Router } from "express";
import { pool } from "../db";
import { validateResource } from "../validate";
import { updateMemberSchema } from "../schemas/member";

const router = Router();

router.get("/:id", async (req: Request, res: Response) => {
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

router.get("/", async (req: Request, res: Response) => {
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

router.patch(
  "/:id",
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

router.delete("/:id", async (req: Request, res: Response) => {
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
});

export default router;

import { Request, Response, Router } from "express";
import { pool } from "../db";
import { validateResource } from "../validate";
import { createMemberSchema, updateMemberSchema } from "../schemas/member";
import { authenticateToken } from "../authMiddleware";
import { diff, logActivity } from "../helper/activityLog";

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

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const foundCheck = await client.query(
        `SELECT id FROM member WHERE email = $1`,
        [email],
      );
      if (foundCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        return res
          .status(409)
          .json({ error: "A member with this email already exists." });
      }

      const result = await client.query(
        `INSERT INTO member (email, full_name,  role, status, active_loans_count, unpaid_fines_total)
         VALUES ($1, $2, 'USER', 'ACTIVE', 0, 0)
         RETURNING *`,
        [email, full_name],
      );
      const member = result.rows[0];

      await logActivity(client, req, {
        action: "CREATE",
        entity: "member",
        entityId: member.id,
        details: { after: member },
      });

      await client.query("COMMIT");
      res.status(201).json(member);
    } catch (error) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: (error as Error).message });
    } finally {
      client.release();
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

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const current = await client.query(
        `SELECT * FROM member WHERE id = $1 FOR UPDATE`,
        [id],
      );
      if (current.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Member not found" });
      }
      const before = current.rows[0];

      const result = await client.query(
        `UPDATE member
              SET ${setClause}
              WHERE id = $${updates.length + 1}
              RETURNING *`,
        [...values, id],
      );
      const member = result.rows[0];

      const changes = diff(before, member);
      if (changes) {
        await logActivity(client, req, {
          action: "UPDATE",
          entity: "member",
          entityId: member.id,
          details: changes,
        });
      }

      await client.query("COMMIT");
      res.json(member);
    } catch (error) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: (error as Error).message });
    } finally {
      client.release();
    }
  },
);

router.delete(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const activeLoanCheck = await client.query(
        `SELECT id FROM loan WHERE member_id = $1 AND status IN ('ACTIVE', 'OVERDUE')`,
        [id],
      );
      if (activeLoanCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Cannot delete a member with active loans" });
      }

      const result = await client.query(
        `DELETE FROM member WHERE id = $1 RETURNING *`,
        [id],
      );
      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Member not found" });
      }
      const member = result.rows[0];

      await logActivity(client, req, {
        action: "DELETE",
        entity: "member",
        entityId: member.id,
        details: { before: member },
      });

      await client.query("COMMIT");
      res.json(member);
    } catch (error) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: (error as Error).message });
    } finally {
      client.release();
    }
  },
);

export default router;

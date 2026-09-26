import { Request, Response, Router } from "express";
import { pool } from "../db";
import { validateResource } from "../validate";
import { authorBodySchema, authorPatchSchema } from "../schemas/author";
import { authenticateToken } from "../authMiddleware";
import { diff, logActivity } from "../helper/activityLog";

const router = Router();

router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT *
      FROM author
      WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Author not found" });
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
      FROM author
      ORDER BY last_name, first_name`,
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post(
  "/",
  authenticateToken,
  validateResource(authorBodySchema),
  async (req: Request, res: Response) => {
    const { first_name, last_name } = req.body;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query(
        `INSERT INTO author (first_name, last_name)
         VALUES ($1, $2)
         RETURNING *`,
        [first_name, last_name],
      );
      const author = result.rows[0];

      await logActivity(client, req, {
        action: "CREATE",
        entity: "author",
        entityId: author.id,
        details: { after: author },
      });

      await client.query("COMMIT");
      res.status(201).json(author);
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
  validateResource(authorPatchSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { first_name, last_name } = req.body;

    const fields: Record<string, unknown> = {
      first_name,
      last_name,
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
        `SELECT * FROM author WHERE id = $1 FOR UPDATE`,
        [id],
      );
      if (current.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Author not found" });
      }
      const before = current.rows[0];

      const result = await client.query(
        `UPDATE author
              SET ${setClause}
              WHERE id = $${updates.length + 1}
              RETURNING *`,
        [...values, id],
      );
      const author = result.rows[0];

      const changes = diff(before, author);
      if (changes) {
        await logActivity(client, req, {
          action: "UPDATE",
          entity: "author",
          entityId: author.id,
          details: changes,
        });
      }

      await client.query("COMMIT");
      res.json(author);
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

      const bookCheck = await client.query(
        `SELECT id FROM book WHERE author_id = $1 LIMIT 1`,
        [id],
      );
      if (bookCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Cannot delete an author who still has books" });
      }

      const result = await client.query(
        `DELETE FROM author WHERE id = $1 RETURNING *`,
        [id],
      );
      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Author not found" });
      }
      const author = result.rows[0];

      await logActivity(client, req, {
        action: "DELETE",
        entity: "author",
        entityId: author.id,
        details: { before: author },
      });

      await client.query("COMMIT");
      res.json(author);
    } catch (error) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: (error as Error).message });
    } finally {
      client.release();
    }
  },
);

export default router;

import { Request, Response, Router } from "express";
import { PoolClient } from "pg";
import { pool } from "../db";
import { validateResource } from "../validate";
import { bookBodySchema, bookPatchSchema } from "../schemas/book";
import { authenticateToken } from "../authMiddleware";
import { diff, logActivity } from "../helper/activityLog";

const router = Router();

const BOOK_WITH_AUTHOR = `SELECT book.*,
    json_build_object(
      'id', author.id,
      'first_name', author.first_name,
      'last_name', author.last_name
    ) AS author
  FROM book
  JOIN author ON author.id = book.author_id`;

async function authorExists(client: PoolClient, authorId: string) {
  const result = await client.query(`SELECT id FROM author WHERE id = $1`, [
    authorId,
  ]);
  return result.rows.length > 0;
}

router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `${BOOK_WITH_AUTHOR}
      WHERE book.id = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`${BOOK_WITH_AUTHOR}
      ORDER BY book.title`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post(
  "/",
  authenticateToken,
  validateResource(bookBodySchema),
  async (req: Request, res: Response) => {
    const { isbn, title, description, author_id, url, genre, total_copies } =
      req.body;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const foundCheck = await client.query(
        `SELECT isbn
        FROM book
        WHERE isbn = $1`,
        [isbn],
      );
      if (foundCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "This book already exist." });
      }

      if (!(await authorExists(client, author_id))) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Author not found" });
      }

      const copies = total_copies ?? 0;

      const result = await client.query(
        `INSERT INTO book (isbn, title, description, author_id, url, genre, total_copies, available_copies)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
        RETURNING *`,
        [
          isbn,
          title,
          description ?? null,
          author_id,
          url ?? null,
          genre,
          copies,
        ],
      );
      const book = result.rows[0];

      await logActivity(client, req, {
        action: "CREATE",
        entity: "book",
        entityId: book.id,
        details: { after: book },
      });

      await client.query("COMMIT");
      res.status(201).json(book);
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
  validateResource(bookPatchSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isbn, title, description, author_id, url, genre, total_copies } =
      req.body;

    const fields: Record<string, unknown> = {
      isbn,
      title,
      description,
      author_id,
      url,
      genre,
      total_copies,
    };

    const updates = Object.entries(fields).filter(([, v]) => v !== undefined);

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields provided to update" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const current = await client.query(
        `SELECT *
        FROM book
        WHERE id = $1
        FOR UPDATE`,
        [id],
      );
      if (current.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Book not found" });
      }
      const before = current.rows[0];

      if (author_id !== undefined && !(await authorExists(client, author_id))) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Author not found" });
      }

      if (
        total_copies !== undefined &&
        total_copies < before.available_copies
      ) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error:
            "Total copies cannot be less than available copies currently in stock.",
        });
      }

      const setClause = updates
        .map(([key], i) => `${key} = $${i + 1}`)
        .join(", ");
      const values = updates.map(([, v]) => v);

      const result = await client.query(
        `UPDATE book
         SET ${setClause}
         WHERE id = $${updates.length + 1}
         RETURNING *`,
        [...values, id],
      );
      const book = result.rows[0];

      const changes = diff(before, book);
      if (changes) {
        await logActivity(client, req, {
          action: "UPDATE",
          entity: "book",
          entityId: book.id,
          details: changes,
        });
      }

      await client.query("COMMIT");
      res.json(book);
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
        `SELECT id
      FROM loan
      WHERE book_id = $1
        AND status IN ('ACTIVE', 'OVERDUE')`,
        [id],
      );
      if (activeLoanCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Cannot delete a book with active loans" });
      }

      const result = await client.query(
        `DELETE FROM book
      WHERE id = $1
      RETURNING *`,
        [id],
      );
      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Book not found" });
      }
      const book = result.rows[0];

      await logActivity(client, req, {
        action: "DELETE",
        entity: "book",
        entityId: book.id,
        details: { before: book },
      });

      await client.query("COMMIT");
      res.json(book);
    } catch (error) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: (error as Error).message });
    } finally {
      client.release();
    }
  },
);

export default router;

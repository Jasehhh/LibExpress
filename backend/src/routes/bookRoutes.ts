import { Request, Response, Router } from "express";
import { pool } from "../db";
import { Book } from "../types/book";
import { validateResource } from "../validate";
import { bookBodySchema, bookPatchSchema } from "../schemas/book";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
        SELECT * 
        FROM book`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});

router.post(
  "/",
  validateResource(bookBodySchema),
  async (req: Request, res: Response) => {
    const { isbn, title, author, genre, total_copies, available_copies }: Book =
      req.body;

    try {
      const foundCheck = await pool.query(
        `SELECT isbn 
      FROM book 
      WHERE isbn = $1`,
        [isbn],
      );
      if (foundCheck.rows.length > 0) {
        return res.status(409).json({ error: "This book already exist." });
      }

      const copies = total_copies ?? 0;
      const available = available_copies ?? copies;
      const result = await pool.query(
        `INSERT INTO book (isbn, title, author genre, total_copies, available_copies)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [isbn, title, author, genre, copies, available],
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
);

router.patch(
  "/:id",
  validateResource(bookPatchSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isbn, title, author, genre, total_copies, available_copies } =
      req.body;

    const fields: Record<string, unknown> = {
      isbn,
      title,
      author,
      genre,
      total_copies,
      available_copies,
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
        `UPDATE book
              SET ${setClause}
              WHERE id = $${updates.length + 1}
              RETURNING *`,
        [...values, id],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Book not found" });
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
    const result = await pool.query(
      `DELETE FROM book
            WHERE id = $1
            RETURNING *`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json((await result).rows[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;

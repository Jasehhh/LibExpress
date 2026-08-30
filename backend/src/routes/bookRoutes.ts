import { Request, Response, Router } from "express";
import { pool } from "../db";
import { validateResource } from "../validate";
import { bookBodySchema, bookPatchSchema } from "../schemas/book";
import { authenticateToken } from "../authMiddleware";

const router = Router();

router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT *
      FROM book
      WHERE id = $1`,
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
    const result = await pool.query(`
        SELECT * 
        FROM book`);
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
    const { isbn, title, author, url, genre, total_copies } = req.body;

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

      const result = await pool.query(
        `INSERT INTO book (isbn, title, author, url, genre, total_copies, available_copies)
        VALUES ($1, $2, $3, $4, $5, $5)
        RETURNING *`,
        [isbn, title, author, url ?? null, genre, copies],
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
  validateResource(bookPatchSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isbn, title, author, url, genre, total_copies } = req.body;

    try {
      if (total_copies !== undefined) {
        const current = await pool.query(
          `SELECT available_copies 
          FROM book 
          WHERE id = $1`,
          [id],
        );
        if (current.rows.length === 0) {
          return res.status(404).json({ error: "Book not found" });
        }
        if (total_copies < current.rows[0].available_copies) {
          return res.status(400).json({
            error:
              "Total copies cannot be less than available copies currently in stock.",
          });
        }
      }

      const fields: Record<string, unknown> = {
        isbn,
        title,
        author,
        url,
        genre,

        total_copies,
      };

      const updates = Object.entries(fields).filter(([, v]) => v !== undefined);

      if (updates.length === 0) {
        return res.status(400).json({ error: "No fields provided to update" });
      }

      const setClause = updates
        .map(([key], i) => `${key} = $${i + 1}`)
        .join(", ");
      const values = updates.map(([, v]) => v);

      const result = await pool.query(
        `UPDATE book
         SET ${setClause}
         WHERE id = $${updates.length + 1}
         RETURNING *`,
        [...values, id],
      );

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
        `SELECT id 
      FROM loan 
      WHERE book_id = $1 
        AND status IN ('ACTIVE', 'OVERDUE')`,
        [id],
      );
      if (activeLoanCheck.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Cannot delete a book with active loans" });
      }

      const result = await pool.query(
        `DELETE FROM book
      WHERE id = $1
      RETURNING *`,
        [id],
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

export default router;

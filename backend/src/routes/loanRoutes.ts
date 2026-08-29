import { Request, Response, Router } from "express";
import { pool } from "../db";
import { validateResource } from "../validate";
import { loanBodySchema, loanPatchSchema } from "../schemas/loan";

const router = Router();
const LOAN_PERIOD_DAYS = 14;

router.get("/member/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * 
      FROM loan 
      WHERE member_id = $1`,
      [id],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT *
      FROM loan
      WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Loan not found" });
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
        FROM loan`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post(
  "/",
  validateResource(loanBodySchema),
  async (req: Request, res: Response) => {
    const { book_id, member_id } = req.body;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const memberCheck = await client.query(
        `SELECT id FROM member WHERE id = $1`,
        [member_id],
      );
      if (memberCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Member not found" });
      }

      const activeLoans = await client.query(
        `SELECT COUNT(*) FROM loan WHERE member_id = $1 AND status = 'ACTIVE'`,
        [member_id],
      );
      if (Number(activeLoans.rows[0].count) >= 5) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Only 5 allowable active loans." });
      }

      const bookUpdate = await client.query(
        `UPDATE book
           SET available_copies = available_copies - 1
           WHERE id = $1 AND available_copies > 0
           RETURNING id`,
        [book_id],
      );
      if (bookUpdate.rows.length === 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "No available copies of this book." });
      }

      const checkoutDate = new Date();
      const dueDate = new Date(checkoutDate);
      dueDate.setDate(dueDate.getDate() + LOAN_PERIOD_DAYS);

      const result = await client.query(
        `INSERT INTO loan (book_id, member_id, status, checkout_date, due_date)
           VALUES ($1, $2, 'ACTIVE', $3, $4)
           RETURNING *`,
        [book_id, member_id, checkoutDate, dueDate],
      );

      await client.query("COMMIT");

      res.status(201).json(result.rows[0]);
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
  validateResource(loanPatchSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { return_date } = req.body;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const loanResult = await client.query(
        `UPDATE loan
             SET status = 'RETURNED', return_date = $1
             WHERE id = $2 AND status IN ('ACTIVE', 'OVERDUE')
             RETURNING *`,
        [return_date, id],
      );

      if (loanResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res
          .status(404)
          .json({ error: "Loan not found or already returned" });
      }

      const loan = loanResult.rows[0];

      if (return_date < loan.checkout_date) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Return date cannot be before checkout date" });
      }
      await client.query(
        `UPDATE book SET available_copies = available_copies + 1 WHERE id = $1`,
        [loan.book_id],
      );

      let fine = null;
      if (new Date(return_date) > new Date(loan.due_date)) {
        const daysLate = Math.ceil(
          (new Date(return_date).getTime() -
            new Date(loan.due_date).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const amount = daysLate * 20.0;

        const fineResult = await client.query(
          `INSERT INTO fine (loan_id, member_id, amount, payment_status)
               VALUES ($1, $2, $3, 'UNPAID')
               RETURNING *`,
          [loan.id, loan.member_id, amount],
        );
        fine = fineResult.rows[0];
        await client.query(
          `UPDATE member
             SET unpaid_fines_total = unpaid_fines_total + $1
             WHERE id = $2`,
          [amount, loan.member_id],
        );
      }

      await client.query("COMMIT");

      res.status(200).json({ loan, fine });
    } catch (error) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: (error as Error).message });
    } finally {
      client.release();
    }
  },
);

export default router;

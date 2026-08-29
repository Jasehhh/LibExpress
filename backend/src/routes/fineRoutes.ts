import { Request, Response, Router } from "express";
import { pool } from "../db";
import { validateResource } from "../validate";
import { finePatchSchema } from "../schemas/fine";
import { Fine } from "../types/fine";

const router = Router();

router.get("/member/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT *
        FROM fine
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
        FROM fine
        WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Fine not found" });
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
         FROM fine
         `,
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.patch(
  "/:id",
  validateResource(finePatchSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { payment_status } = req.body;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const previousResult = await client.query(
        `SELECT payment_status, amount, member_id FROM fine WHERE id = $1`,
        [id],
      );
      if (previousResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Fine not found" });
      }
      const previousStatus = previousResult.rows[0].payment_status;

      const result = await client.query(
        `UPDATE fine SET payment_status = $1 WHERE id = $2 RETURNING *`,
        [payment_status, id],
      );
      const fine = result.rows[0];

      if (previousStatus !== payment_status) {
        if (payment_status === "PAID") {
          await client.query(
            `UPDATE member SET unpaid_fines_total = unpaid_fines_total - $1 WHERE id = $2`,
            [fine.amount, fine.member_id],
          );
        } else if (payment_status === "UNPAID") {
          await client.query(
            `UPDATE member SET unpaid_fines_total = unpaid_fines_total + $1 WHERE id = $2`,
            [fine.amount, fine.member_id],
          );
        }
      }

      await client.query("COMMIT");

      res.status(200).json(fine);
    } catch (error) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: (error as Error).message });
    } finally {
      client.release();
    }
  },
);

export default router;

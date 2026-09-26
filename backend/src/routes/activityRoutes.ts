import { Request, Response, Router } from "express";
import { pool } from "../db";
import { authenticateToken } from "../authMiddleware";
import { activityQuerySchema } from "../schemas/activity";
import { validationError } from "../validate";

const router = Router();

router.get("/", authenticateToken, async (req: Request, res: Response) => {
  const parsed = activityQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json(validationError(parsed.error));
  }
  const { entity, entity_id, admin_id, limit, offset } = parsed.data;

  const filters: Record<string, string | undefined> = {
    entity,
    entity_id,
    admin_id,
  };
  const active = Object.entries(filters).filter(([, v]) => v !== undefined);
  const where = active.length
    ? `WHERE ${active.map(([key], i) => `${key} = $${i + 1}`).join(" AND ")}`
    : "";
  const values = active.map(([, v]) => v);

  // One snapshot for both queries so total always matches data.
  const client = await pool.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const totalResult = await client.query(
      `SELECT COUNT(*) FROM activity_log ${where}`,
      values,
    );
    const result = await client.query(
      `SELECT *
       FROM activity_log
       ${where}
       ORDER BY created_at DESC, id DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset],
    );
    await client.query("COMMIT");
    res.json({ data: result.rows, total: Number(totalResult.rows[0].count) });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: (error as Error).message });
  } finally {
    client.release();
  }
});

export default router;

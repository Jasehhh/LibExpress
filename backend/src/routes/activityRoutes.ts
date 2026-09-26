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

  try {
    const totalResult = await pool.query(
      `SELECT COUNT(*) FROM activity_log ${where}`,
      values,
    );
    const result = await pool.query(
      `SELECT *
       FROM activity_log
       ${where}
       ORDER BY created_at DESC, id DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset],
    );
    res.json({ data: result.rows, total: Number(totalResult.rows[0].count) });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;

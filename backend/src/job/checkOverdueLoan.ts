import { pool } from "../db";
import { logSystemActivity } from "../helper/activityLog";

export async function checkOverdueLoans() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE loan
       SET status = 'OVERDUE'
       WHERE status = 'ACTIVE' AND due_date < NOW()
       RETURNING id`,
    );

    if (result.rows.length > 0) {
      await logSystemActivity(client, {
        action: "UPDATE",
        entity: "loan",
        entityId: null,
        details: { loan_ids: result.rows.map((row) => row.id) },
      });
    }

    await client.query("COMMIT");

    if (result.rows.length > 0) {
      console.error(`Marked ${result.rows.length} loan(s) as OVERDUE`);
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error checking overdue loans:", error);
  } finally {
    client.release();
  }
}

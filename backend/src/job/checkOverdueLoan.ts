import { pool } from "../db";

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

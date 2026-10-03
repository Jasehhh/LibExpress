import cron, { type ScheduledTask } from "node-cron";

import { db } from "~/server/db";
import { logSystemActivity } from "~/server/lib/activityLog";

export async function checkOverdueLoans() {
  try {
    const loanIds = await db.$transaction(async (tx) => {
      const overdue = await tx.loan.findMany({
        where: { status: "ACTIVE", dueDate: { lt: new Date() } },
        select: { id: true },
      });
      const ids = overdue.map((loan) => loan.id);
      if (ids.length === 0) return ids;

      await tx.loan.updateMany({
        where: { id: { in: ids }, status: "ACTIVE" },
        data: { status: "OVERDUE" },
      });

      await logSystemActivity(tx, {
        action: "UPDATE",
        entity: "loan",
        entityId: null,
        details: { loan_ids: ids },
      });

      return ids;
    });

    if (loanIds.length > 0) {
      console.log(`Marked ${loanIds.length} loan(s) as OVERDUE`);
    }
  } catch (error) {
    console.error("Error checking overdue loans:", error);
  }
}

const globalForCron = globalThis as unknown as {
  overdueLoanTask: ScheduledTask | undefined;
};

// Every night at midnight. Started once per server from instrumentation.ts;
// the guard stops dev reloads from adding a second schedule.
export function scheduleOverdueLoanCheck() {
  globalForCron.overdueLoanTask ??= cron.schedule("0 0 * * *", () => {
    void checkOverdueLoans();
  });
}

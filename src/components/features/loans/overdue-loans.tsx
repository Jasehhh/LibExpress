"use client";

import Link from "next/link";

import { Panel, PanelEmpty } from "~/components/admin/panel";
import { formatMoney } from "~/components/features/fines/money";
import { TIME_ZONE } from "~/lib/time";
import { api } from "~/trpc/react";

const dueOn = new Intl.DateTimeFormat("en-PH", {
  timeZone: TIME_ZONE,
  month: "short",
  day: "numeric",
});

export function OverdueLoans() {
  const [{ loans, total }] = api.dashboard.overdueLoans.useSuspenseQuery(
    undefined,
    { refetchInterval: 60_000 },
  );

  return (
    <Panel
      title="Late books"
      aside={
        total > loans.length
          ? `Longest overdue ${loans.length} of ${total}`
          : undefined
      }
    >
      {loans.length > 0 ? (
        <ul className="divide-border divide-y px-5 pb-2 sm:px-6">
          {loans.map((loan) => (
            <li key={loan.id} className="flex items-center gap-4 py-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/books/${loan.bookId}`}
                  className="text-foreground focus-visible:ring-primary-light block truncate rounded text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                >
                  {loan.title}
                </Link>
                <p className="text-muted truncate text-sm">
                  {loan.member}, due {dueOn.format(loan.dueDate)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-tile-coral text-sm font-bold tabular-nums">
                  {loan.daysLate === 1 ? "1 day" : `${loan.daysLate} days`} late
                </p>
                <p className="text-muted text-sm tabular-nums">
                  {formatMoney(loan.accruing)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <PanelEmpty title="No late books">
          Every borrowed book is still within its due date.
        </PanelEmpty>
      )}
    </Panel>
  );
}

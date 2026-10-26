"use client";

import { Panel, PanelEmpty } from "~/components/admin/panel";
import { formatMoney } from "~/components/features/fines/money";
import { TABLE_HEAD_CLASS } from "~/components/ui/data-table";
import { Pill, type PillTone } from "~/components/ui/pill";
import { type ActivityItem } from "~/lib/types";
import { api } from "~/trpc/react";

const TYPES: Partial<
  Record<ActivityItem["kind"], { label: string; tone: PillTone }>
> = {
  checkout: { label: "Checkout", tone: "info" },
  return: { label: "Return", tone: "good" },
  fine: { label: "Late fine", tone: "bad" },
  paid: { label: "Fine paid", tone: "good" },
  unpaid: { label: "Fine unpaid", tone: "bad" },
};

const time = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function RecentTransactions() {
  const [items] = api.dashboard.activity.useSuspenseQuery(undefined, {
    refetchInterval: 10_000,
  });
  const rows = items.filter((item) => TYPES[item.kind]);

  return (
    <Panel title="Recent transactions">
      {rows.length > 0 ? (
        <table className="w-full table-fixed text-left text-sm">
          <thead className={`${TABLE_HEAD_CLASS} border-border border-y`}>
            <tr>
              <th scope="col" className="w-36 px-5 py-2.5 font-medium sm:px-6">
                Time
              </th>
              <th scope="col" className="w-32 px-3 py-2.5 font-medium">
                Type
              </th>
              <th scope="col" className="px-3 py-2.5 font-medium">
                Book
              </th>
              <th
                scope="col"
                className="hidden px-3 py-2.5 font-medium md:table-cell"
              >
                Member
              </th>
              <th
                scope="col"
                className="hidden w-28 px-5 py-2.5 text-right font-medium sm:table-cell sm:px-6"
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {rows.map((item) => {
              const type = TYPES[item.kind]!;
              return (
                <tr key={item.id}>
                  <td className="text-muted px-5 py-3 whitespace-nowrap tabular-nums sm:px-6">
                    <time
                      dateTime={item.createdAt.toISOString()}
                      suppressHydrationWarning
                    >
                      {time.format(item.createdAt)}
                    </time>
                  </td>
                  <td className="px-3 py-3">
                    <Pill tone={type.tone}>{type.label}</Pill>
                  </td>
                  <td className="text-foreground truncate px-3 py-3 font-medium">
                    {item.book ?? "Unknown book"}
                  </td>
                  <td className="text-muted hidden truncate px-3 py-3 md:table-cell">
                    {item.member ?? "Unknown member"}
                  </td>
                  <td className="text-foreground hidden px-5 py-3 text-right font-semibold tabular-nums sm:table-cell sm:px-6">
                    {item.amount ? formatMoney(item.amount) : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <PanelEmpty title="No transactions yet">
          Checkouts, returns and fine payments show up here.
        </PanelEmpty>
      )}
    </Panel>
  );
}

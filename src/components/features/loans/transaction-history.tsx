"use client";

import { useState } from "react";

import { formatMoney } from "~/components/features/fines/money";
import { TRANSACTION_KINDS } from "~/components/features/loans/transaction-kinds";
import {
  FilterSelect,
  Pagination,
  SearchInput,
  TABLE_HEAD_CLASS,
  TableCard,
  TableEmpty,
} from "~/components/ui/data-table";
import { Pill } from "~/components/ui/pill";
import { type Transaction } from "~/lib/types";
import { api } from "~/trpc/react";

const PAGE_SIZE = 10;

const when = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function TransactionHistory() {
  const [transactions] = api.loan.getTransactions.useSuspenseQuery(undefined, {
    refetchInterval: 10_000,
  });
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<Transaction["kind"] | "">("");
  const [page, setPage] = useState(1);

  const needle = query.trim().toLowerCase();
  const filtered = transactions.filter(
    (t) =>
      (!needle ||
        `${t.title} ${t.member} ${t.email}`.toLowerCase().includes(needle)) &&
      (!kind || t.kind === kind),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <TableCard
      label="Transaction history"
      title="Transaction history"
      toolbar={
        <>
          <SearchInput
            id="transaction-filter"
            label="Search transactions"
            value={query}
            onChange={(value) => {
              setQuery(value);
              setPage(1);
            }}
            placeholder="Search by book, member name or email"
          />
          <FilterSelect
            label="Type"
            value={kind}
            onChange={(value) => {
              setKind(value as Transaction["kind"] | "");
              setPage(1);
            }}
            options={[
              ["", "All types"],
              ...Object.entries(TRANSACTION_KINDS).map(
                ([key, { label }]) => [key, label] as const,
              ),
            ]}
          />
        </>
      }
    >
      {shown.length > 0 ? (
        <table className="w-full table-fixed text-left text-sm">
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
              <th
                scope="col"
                className="hidden w-48 px-5 py-3 font-medium md:table-cell"
              >
                Date
              </th>
              <th scope="col" className="w-32 px-3 py-3 font-medium sm:px-5">
                Type
              </th>
              <th scope="col" className="px-3 py-3 font-medium sm:px-5">
                Book
              </th>
              <th
                scope="col"
                className="hidden px-5 py-3 font-medium lg:table-cell"
              >
                Member
              </th>
              <th
                scope="col"
                className="hidden w-28 px-5 py-3 text-right font-medium sm:table-cell"
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {shown.map((t) => {
              const type = TRANSACTION_KINDS[t.kind];
              return (
                <tr key={t.id} className="hover:bg-background">
                  <td className="text-muted hidden px-5 py-3 whitespace-nowrap tabular-nums md:table-cell">
                    <time
                      dateTime={t.at.toISOString()}
                      suppressHydrationWarning
                    >
                      {when.format(t.at)}
                    </time>
                  </td>
                  <td className="px-3 py-3 sm:px-5">
                    <Pill tone={type.tone}>{type.label}</Pill>
                  </td>
                  <td className="px-3 py-3 sm:px-5">
                    <p className="text-foreground truncate font-semibold">
                      {t.title}
                    </p>
                    {/* Narrow screens fold the member and date in here. */}
                    <p className="text-muted truncate text-xs lg:hidden">
                      {t.member}
                      <span className="md:hidden">, {when.format(t.at)}</span>
                    </p>
                  </td>
                  <td className="hidden px-5 py-3 lg:table-cell">
                    <p className="text-foreground truncate">{t.member}</p>
                    <p className="text-muted truncate text-xs">{t.email}</p>
                  </td>
                  <td className="text-foreground hidden px-5 py-3 text-right font-semibold tabular-nums sm:table-cell">
                    {t.amount ? formatMoney(t.amount) : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : needle || kind ? (
        <TableEmpty
          title="No transactions match these filters."
          onClear={() => {
            setQuery("");
            setKind("");
            setPage(1);
          }}
        />
      ) : (
        <TableEmpty
          title="No transactions yet."
          body="Checkouts, returns and fines show up here as the desk records them."
        />
      )}

      {filtered.length > 0 && (
        <Pagination
          page={current}
          pageSize={PAGE_SIZE}
          shown={shown.length}
          total={filtered.length}
          onPage={setPage}
        />
      )}
    </TableCard>
  );
}

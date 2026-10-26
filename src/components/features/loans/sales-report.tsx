"use client";

import { useState } from "react";

import { formatMoney } from "~/components/features/fines/money";
import { TRANSACTION_KINDS } from "~/components/features/loans/transaction-kinds";
import { TableEmpty } from "~/components/ui/data-table";
import { BUTTON_CLASS } from "~/components/ui/form-field";
import { Pill } from "~/components/ui/pill";
import { type Transaction } from "~/lib/types";
import { api } from "~/trpc/react";

const PERIODS = [
  { key: "today", label: "Today", days: 1 },
  { key: "week", label: "7 days", days: 7 },
  { key: "month", label: "30 days", days: 30 },
  { key: "all", label: "All time", days: null },
] as const;
type Period = (typeof PERIODS)[number]["key"];

const ENTRIES_PER_PAGE = 40;

const dayHeading = new Intl.DateTimeFormat("en-PH", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
const shortDay = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const clock = new Intl.DateTimeFormat("en-PH", {
  hour: "numeric",
  minute: "2-digit",
});

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

// Totals for a set of transactions: what went out, came back, was charged
// and was collected.
function tally(entries: Transaction[]) {
  const sum = (kind: Transaction["kind"]) =>
    entries
      .filter((t) => t.kind === kind)
      .reduce((total, t) => total + Number(t.amount ?? 0), 0);
  const count = (kind: Transaction["kind"]) =>
    entries.filter((t) => t.kind === kind).length;
  return {
    checkouts: count("checkout"),
    returns: count("return"),
    charged: sum("fine"),
    collected: sum("paid"),
  };
}

function exportCsv(entries: Transaction[], period: string) {
  const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = [
    ["Date", "Time", "Type", "Book", "Member", "Email", "Amount"],
    ...entries.map((t) => [
      shortDay.format(t.at),
      clock.format(t.at),
      TRANSACTION_KINDS[t.kind].label,
      t.title,
      t.member,
      t.email,
      t.amount ?? "",
    ]),
  ];
  const csv = rows.map((row) => row.map(cell).join(",")).join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = `libexpress-sales-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  // Let the download start before the file URL is released.
  setTimeout(() => URL.revokeObjectURL(link.href), 0);
}

export function SalesReport() {
  const [transactions] = api.loan.getTransactions.useSuspenseQuery(undefined, {
    refetchInterval: 30_000,
  });
  const [period, setPeriod] = useState<Period>("month");
  const [limit, setLimit] = useState(ENTRIES_PER_PAGE);

  const days = PERIODS.find((p) => p.key === period)!.days;
  const from = days
    ? new Date(startOfDay(new Date()).getTime() - (days - 1) * 86_400_000)
    : null;
  const entries = from
    ? transactions.filter((t) => t.at >= from)
    : transactions;
  const totals = tally(entries);
  const shown = entries.slice(0, limit);

  // Group the shown entries under the day they happened (newest day first).
  const byDay = new Map<number, Transaction[]>();
  for (const entry of shown) {
    const key = startOfDay(entry.at).getTime();
    byDay.set(key, [...(byDay.get(key) ?? []), entry]);
  }

  const today = shortDay.format(new Date());
  const rangeText = !from
    ? "Every transaction on record"
    : days === 1
      ? today
      : `${shortDay.format(from)} to ${today}`;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted text-sm">{rangeText}</p>
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="radiogroup"
            aria-label="Period"
            className="border-navy-light bg-surface flex rounded-lg border p-1"
          >
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                role="radio"
                aria-checked={period === p.key}
                onClick={() => {
                  setPeriod(p.key);
                  setLimit(ENTRIES_PER_PAGE);
                }}
                className={`focus-visible:ring-primary-light rounded-md px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none ${
                  period === p.key
                    ? "bg-navy text-white"
                    : "text-muted hover:text-navy"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={entries.length === 0}
            onClick={() => exportCsv(entries, period)}
            className={BUTTON_CLASS.secondary}
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <Summary totals={totals} />

      <section
        aria-label="Sales report entries"
        className="border-navy-light bg-surface mt-6 overflow-hidden rounded-2xl border"
      >
        {shown.length > 0 ? (
          [...byDay].map(([key, dayEntries]) => {
            const day = tally(dayEntries);
            return (
              <div
                key={key}
                className="border-border border-t first:border-t-0"
              >
                <div className="bg-surface-muted/60 border-border flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b px-5 py-2.5 sm:px-6">
                  <h2 className="text-navy text-sm font-semibold">
                    {dayHeading.format(new Date(key))}
                  </h2>
                  <p className="text-muted flex gap-4 text-xs tabular-nums">
                    <span>{day.checkouts} out</span>
                    <span>{day.returns} in</span>
                    {day.collected > 0 && (
                      <span className="text-success font-semibold">
                        {formatMoney(day.collected)} collected
                      </span>
                    )}
                  </p>
                </div>
                <ul className="divide-border divide-y">
                  {dayEntries.map((t) => (
                    <Entry key={t.id} entry={t} />
                  ))}
                </ul>
              </div>
            );
          })
        ) : (
          <TableEmpty
            title="Nothing logged in this period."
            body="Checkouts, returns and fines appear here as the desk records them."
          />
        )}

        {entries.length > shown.length && (
          <button
            type="button"
            onClick={() => setLimit((n) => n + ENTRIES_PER_PAGE)}
            className="text-navy border-border hover:bg-background focus-visible:ring-primary-light w-full border-t px-6 py-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
          >
            Show older entries ({entries.length - shown.length} more)
          </button>
        )}
      </section>
    </>
  );
}

function Summary({ totals }: { totals: ReturnType<typeof tally> }) {
  const rate = totals.charged
    ? Math.min(100, Math.round((totals.collected / totals.charged) * 100))
    : null;

  return (
    <section
      aria-label="Period totals"
      className="bg-navy text-on-navy rounded-2xl px-6 py-6 shadow-[0_14px_30px_-16px_rgba(24,36,66,0.6)] sm:px-8"
    >
      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4">
        <Figure
          label="Fines collected"
          value={formatMoney(totals.collected)}
          highlight
        />
        <Figure label="Fines charged" value={formatMoney(totals.charged)} />
        <Figure label="Checkouts" value={totals.checkouts.toString()} />
        <Figure label="Returns" value={totals.returns.toString()} />
      </dl>

      <div className="mt-6 border-t border-white/10 pt-5">
        <div className="flex items-baseline justify-between gap-4 text-sm">
          <p className="text-on-navy-muted">Collected of what was charged</p>
          <p className="font-semibold tabular-nums">
            {rate === null ? "No fines charged" : `${rate}%`}
          </p>
        </div>
        <div
          role="progressbar"
          aria-label="Fines collected"
          aria-valuenow={rate ?? 0}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"
        >
          <div
            className={`bg-chart-back h-full rounded-full transition-[width] duration-500 ${RATE_WIDTHS[Math.round((rate ?? 0) / 10)]}`}
          />
        </div>
      </div>
    </section>
  );
}

// Bar length in 10% steps, so it stays a Tailwind class.
const RATE_WIDTHS = [
  "w-0",
  "w-[10%]",
  "w-[20%]",
  "w-[30%]",
  "w-[40%]",
  "w-1/2",
  "w-[60%]",
  "w-[70%]",
  "w-[80%]",
  "w-[90%]",
  "w-full",
];

function Figure({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-on-navy-muted text-sm">{label}</dt>
      <dd
        className={`mt-1 text-3xl font-bold tracking-tight tabular-nums ${highlight ? "text-chart-back" : "text-white"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function Entry({ entry }: { entry: Transaction }) {
  const type = TRANSACTION_KINDS[entry.kind];
  return (
    <li className="hover:bg-background grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-x-4 px-5 py-3 text-sm sm:grid-cols-[5rem_7.5rem_minmax(0,1.4fr)_minmax(0,1fr)_7rem] sm:px-6">
      <time
        dateTime={entry.at.toISOString()}
        suppressHydrationWarning
        className="text-muted tabular-nums"
      >
        {clock.format(entry.at)}
      </time>
      <span className="hidden sm:block">
        <Pill tone={type.tone}>{type.label}</Pill>
      </span>
      <div className="min-w-0">
        <p className="text-foreground truncate font-semibold">{entry.title}</p>
        <p className="text-muted truncate text-xs sm:hidden">
          {type.label}, {entry.member}
        </p>
      </div>
      <p className="text-muted hidden truncate sm:block">{entry.member}</p>
      <p
        className={`text-right font-semibold tabular-nums ${
          entry.kind === "paid"
            ? "text-success"
            : entry.kind === "fine"
              ? "text-danger"
              : "text-muted"
        }`}
      >
        {entry.amount
          ? `${entry.kind === "paid" ? "+" : ""}${formatMoney(entry.amount)}`
          : ""}
      </p>
    </li>
  );
}

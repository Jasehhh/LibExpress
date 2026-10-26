"use client";

import { useEffect, useRef, useState } from "react";

import { Panel, PanelEmpty } from "~/components/admin/panel";
import { formatMoney } from "~/components/features/fines/money";
import { type ActivityItem } from "~/lib/types";
import { api } from "~/trpc/react";

const REFRESH_MS = 10_000;

const VISIBLE_ROWS = 6;

const LABELS: Record<ActivityItem["kind"], string> = {
  added: "Added to catalog",
  checkout: "Checked out",
  return: "Returned",
  fine: "Late fine",
  paid: "Fine paid",
  unpaid: "Fine unpaid",
};

function describe(item: ActivityItem): React.ReactNode {
  const book = <Name>{item.book ?? "A book"}</Name>;
  // Members stand out in blue so the reader sees who at a glance.
  const member = (
    <span className="text-chart-out font-semibold">
      {item.member ?? "a member"}
    </span>
  );
  const amount = <Name>{item.amount ? formatMoney(item.amount) : "A"}</Name>;

  switch (item.kind) {
    case "added":
      return <>{book} added to the catalog</>;
    case "checkout":
      return (
        <>
          {book} checked out to {member}
        </>
      );
    case "return":
      return (
        <>
          {book} returned by {member}
        </>
      );
    case "fine":
      return (
        <>
          {amount} late fine for {member}
          {item.book && <> on {item.book}</>}
        </>
      );
    case "paid":
      return (
        <>
          {member} paid a {amount} fine
        </>
      );
    case "unpaid":
      return (
        <>
          {member}&apos;s {amount} fine marked unpaid
        </>
      );
  }
}

// Every loan, return, fine and payment is written to the activity log by its
// router, so it lands here on the next refresh without extra wiring.
export function ActivityFeed() {
  const [items] = api.dashboard.activity.useSuspenseQuery(undefined, {
    refetchInterval: REFRESH_MS,
  });
  const now = useNow(30_000);
  const [expanded, setExpanded] = useState(false);

  // Rows that arrive after the page opened drop in at the top.
  const seen = useRef<Set<string> | null>(null);
  seen.current ??= new Set(items.map((item) => item.id));
  const fresh = new Set(
    items.filter((item) => !seen.current!.has(item.id)).map((item) => item.id),
  );
  useEffect(() => {
    for (const id of fresh) seen.current!.add(id);
  });

  const shown = expanded ? items : items.slice(0, VISIBLE_ROWS);

  return (
    <Panel title="Live activity">
      {items.length > 0 ? (
        <>
          <ol
            aria-live="polite"
            className="divide-border divide-y px-5 sm:px-6"
          >
            {shown.map((item) => (
              <li
                key={item.id}
                className={`flex items-start gap-3 py-3 ${
                  fresh.has(item.id) ? "motion-safe:animate-arrive" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{describe(item)}</p>
                  <p className="text-muted mt-0.5 text-xs">
                    {LABELS[item.kind]}
                    {item.staff && <>, by {item.staff.split("@")[0]}</>}
                  </p>
                </div>
                <time
                  dateTime={item.createdAt.toISOString()}
                  title={item.createdAt.toLocaleString()}
                  suppressHydrationWarning
                  className="text-muted shrink-0 pt-0.5 text-xs whitespace-nowrap"
                >
                  {timeAgo(item.createdAt, now)}
                </time>
              </li>
            ))}
          </ol>

          {items.length > VISIBLE_ROWS && (
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              aria-expanded={expanded}
              className="text-navy border-border hover:bg-background focus-visible:ring-primary-light mt-auto rounded-b-2xl border-t px-6 py-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
            >
              {expanded ? "Show fewer" : `Show all ${items.length}`}
            </button>
          )}
        </>
      ) : (
        <PanelEmpty title="Nothing recorded yet">
          New books, checkouts, returns and fines show up here as staff record
          them.
        </PanelEmpty>
      )}
    </Panel>
  );
}

function Name({ children }: { children: React.ReactNode }) {
  return <span className="text-foreground font-semibold">{children}</span>;
}

function useNow(everyMs: number) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), everyMs);
    return () => clearInterval(timer);
  }, [everyMs]);
  return now;
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(date: Date, now: Date) {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  if (seconds > -45) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes > -60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours > -24) return relative.format(hours, "hour");
  return relative.format(Math.round(hours / 24), "day");
}

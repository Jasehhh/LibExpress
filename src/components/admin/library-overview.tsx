"use client";

import { useDashboard } from "~/components/admin/use-dashboard";
import { formatMoney } from "~/components/features/fines/money";

const count = new Intl.NumberFormat("en-PH");
const compact = new Intl.NumberFormat("en-PH", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const plural = (n: number, one: string, many: string) =>
  `${count.format(n)} ${n === 1 ? one : many}`;

// The four numbers the desk checks first.
export function LibraryOverview() {
  const { overview } = useDashboard();
  const {
    titles,
    members,
    copies,
    borrowed,
    dueSoon,
    dueSoonDays,
    unpaidFines,
    unpaidFinesCount,
  } = overview;

  return (
    <section aria-label="Library totals">
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Total books"
          value={compact.format(titles)}
          note={plural(copies, "copy", "copies")}
          tile="bg-navy"
          icon={
            <path d="M5 4.5h4v15H5zM10 4.5h4v15h-4zM15.2 5.3l3.8-1 3 14.2-3.8 1z" />
          }
        />
        <Stat
          label="Books borrowed"
          value={compact.format(borrowed)}
          note={
            dueSoon > 0
              ? `${count.format(dueSoon)} due in ${dueSoonDays} days`
              : `None due in ${dueSoonDays} days`
          }
          tile="bg-tile-teal"
          icon={<path d="M7 17 17 7M9 7h8v8" />}
        />
        <Stat
          label="Overdue fines"
          value={formatMoney(unpaidFines)}
          note={
            unpaidFinesCount > 0
              ? plural(unpaidFinesCount, "unpaid fine", "unpaid fines")
              : "Every fine is paid"
          }
          tile="bg-tile-coral"
          icon={
            <>
              <circle cx="12" cy="12" r="8" />
              <path d="M12 7.5v5l3 2" />
            </>
          }
        />
        <Stat
          label="Active members"
          value={compact.format(members)}
          note="Can borrow today"
          tile="bg-tile-blue"
          icon={
            <>
              <circle cx="9" cy="9" r="3.5" />
              <path d="M3 19a6 6 0 0 1 12 0M16 5.5a3.5 3.5 0 0 1 0 7M18 13.5a6 6 0 0 1 3 5.5" />
            </>
          }
        />
      </dl>
    </section>
  );
}

function Stat({
  label,
  value,
  note,
  tile,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  tile: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`relative isolate flex flex-col overflow-hidden rounded-2xl px-6 pt-5 pb-6 text-white shadow-[0_14px_30px_-16px_rgba(24,36,66,0.6)] ${tile}`}
    >
      {/* The tile's icon, oversized and faint, bleeding off the corner. */}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="absolute -right-5 -bottom-6 -z-10 size-36 text-white/12"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icon}
      </svg>
      <dt className="text-sm font-medium text-white/80">{label}</dt>
      <dd className="mt-3 text-4xl leading-none font-bold tracking-tight tabular-nums">
        {value}
      </dd>
      <dd className="mt-3 truncate text-sm text-white/80">{note}</dd>
    </div>
  );
}

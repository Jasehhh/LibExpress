"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { fetchActivity } from "@/app/api/activityService";
import { fetchBooks } from "@/app/api/bookService";
import { fetchFines } from "@/app/api/fineService";
import { fetchLoans } from "@/app/api/loanService";
import { fetchMembers } from "@/app/api/memberService";
import { CheckoutDialog, ReturnDialog } from "@/components/admin/Circulation";
import { useStaff } from "@/components/admin/StaffShell";
import { LoanStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Controls";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { actorName, describeActivity } from "@/lib/activity";
import { formatDate, formatMoney, fullName, genreLabel, GENRES, plural, relativeTime } from "@/lib/format";
import { byDueDate, byId, isLate, isOpen } from "@/lib/loans";
import { daysLate, daysUntil } from "@/lib/rules";
import { useNow } from "@/lib/useNow";
import { useQuery } from "@/lib/useQuery";
import { Loan } from "@/lib/types/loan";

const DUE_LIST_LENGTH = 8;

export function OverviewScreen() {
  const { token } = useStaff();
  const now = useNow();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [returning, setReturning] = useState<Loan | null>(null);

  const load = useCallback(
    () =>
      Promise.all([
        fetchBooks(),
        fetchMembers(token),
        fetchLoans(token),
        fetchFines(token),
        fetchActivity({ limit: 6 }, token),
      ]).then(([books, members, loans, fines, activity]) => ({ books, members, loans, fines, activity })),
    [token],
  );
  const { data, error, reload } = useQuery(load);

  const view = useMemo(() => {
    if (!data) return null;
    const open = data.loans.filter(isOpen).sort(byDueDate);
    const late = open.filter((loan) => isLate(loan, now));
    const copies = data.books.reduce((sum, book) => sum + book.total_copies, 0);
    const onShelf = data.books.reduce((sum, book) => sum + book.available_copies, 0);
    const unpaid = data.fines.filter((fine) => fine.payment_status === "UNPAID");
    const unpaidTotal = unpaid.reduce((sum, fine) => sum + Number(fine.amount), 0);
    const genreCounts = GENRES.map((genre) => ({
      genre,
      count: data.books.filter((book) => book.genre === genre).length,
    })).filter((g) => g.count > 0);
    return {
      open,
      late,
      copies,
      onShelf,
      unpaid,
      unpaidTotal,
      genreCounts,
      books: byId(data.books),
      members: byId(data.members),
      loans: byId(data.loans),
    };
  }, [data, now]);

  const today = new Intl.DateTimeFormat("en-PH", { weekday: "long", month: "long", day: "numeric" }).format(now);

  return (
    <>
      <PageHeader
        title="Overview"
        description={today}
        actions={
          <Button onClick={() => setCheckoutOpen(true)} disabled={!data}>
            Check out a book
          </Button>
        }
      />

      {error && !data && <ErrorState message={error.message} onRetry={reload} />}
      {!data && !error && <LoadingState label="Loading overview" />}

      {data && view && (
        <div className="flex flex-col gap-12">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-rule bg-rule md:grid-cols-4">
            <Figure href="/admin/loans" label="Books on loan" value={view.open.length} />
            <Figure
              href="/admin/loans?status=late"
              label="Overdue"
              value={view.late.length}
              tone={view.late.length > 0 ? "overdue" : undefined}
            />
            <Figure
              href="/admin/books"
              label="Copies on the shelf"
              value={view.onShelf}
              detail={`of ${view.copies} in ${plural(data.books.length, "title")}`}
            />
            <Figure
              href="/admin/fines"
              label="Unpaid fines"
              value={formatMoney(view.unpaidTotal)}
              detail={plural(view.unpaid.length, "fine")}
              tone={view.unpaid.length > 0 ? "overdue" : undefined}
            />
          </dl>

          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <section aria-labelledby="due-heading">
              <SectionHeading id="due-heading" title="Due back next" href="/admin/loans" linkLabel="All loans" />
              {view.open.length === 0 ? (
                <EmptyState title="Every book is on the shelf">
                  Nothing is checked out right now. Loans you record will be listed here by due date.
                </EmptyState>
              ) : (
                <ul className="divide-y divide-rule border-y border-rule">
                  {view.open.slice(0, DUE_LIST_LENGTH).map((loan) => {
                    const book = view.books.get(loan.book_id);
                    const member = view.members.get(loan.member_id);
                    const late = isLate(loan, now);
                    const days = daysUntil(loan.due_date, now);
                    return (
                      <li key={loan.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                        <div className="min-w-0 flex-1 basis-60">
                          <p className="truncate font-semibold">{book?.title ?? "Unknown book"}</p>
                          <p className="truncate text-sm text-ink-soft">
                            {member ? (
                              <Link href={`/admin/members/${member.id}`} className="hover:text-stamp hover:underline">
                                {fullName(member)}
                              </Link>
                            ) : (
                              "Unknown member"
                            )}
                          </p>
                        </div>
                        <div className="w-36 text-sm">
                          <LoanStatusBadge status={loan.status} pastDue={late} />
                          <p className={`mt-0.5 tabular-nums ${late ? "text-overdue" : "text-ink-soft"}`}>
                            {late
                              ? `${plural(daysLate(loan.due_date, new Date(now)), "day")} late`
                              : days === 0
                                ? "Due today"
                                : `Due ${formatDate(loan.due_date)}`}
                          </p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setReturning(loan)}>
                          Return
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {view.open.length > DUE_LIST_LENGTH && (
                <p className="mt-3 text-sm text-ink-soft">
                  {plural(view.open.length - DUE_LIST_LENGTH, "more loan")} on the{" "}
                  <Link href="/admin/loans" className="font-semibold text-stamp hover:underline">
                    Loans page
                  </Link>
                  .
                </p>
              )}
            </section>

            <section aria-labelledby="activity-heading">
              <SectionHeading id="activity-heading" title="Recent changes" href="/admin/activity" linkLabel="Activity log" />
              {data.activity.data.length === 0 ? (
                <p className="text-ink-soft">No changes recorded yet.</p>
              ) : (
                <ol className="flex flex-col gap-4">
                  {data.activity.data.map((log) => (
                    <li key={log.id} className="border-l-2 border-rule-strong pl-4">
                      <p className="text-[0.9375rem] leading-snug">
                        <span className="font-semibold">{actorName(log)}</span> {describeActivity(log, view)}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-soft">
                        <time dateTime={log.created_at}>{relativeTime(log.created_at, now)}</time>
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          {view.genreCounts.length > 0 && (
            <section aria-labelledby="genre-heading">
              <SectionHeading id="genre-heading" title="The collection by genre" href="/admin/books" linkLabel="Books" />
              <ul className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
                {view.genreCounts.map(({ genre, count }) => (
                  <li key={genre} className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-3 text-[0.9375rem]">
                    <span>{genreLabel(genre)}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-rule" aria-hidden>
                      <span
                        className="block h-full rounded-full bg-ink"
                        style={{ width: `${(count / data.books.length) * 100}%` }}
                      />
                    </span>
                    <span className="text-right tabular-nums text-ink-soft">{count}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {data && (
        <>
          <CheckoutDialog
            open={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            token={token}
            books={data.books}
            members={data.members}
            loans={data.loans}
            onCheckedOut={reload}
          />
          <ReturnDialog
            loan={returning}
            onClose={() => setReturning(null)}
            token={token}
            book={returning ? view?.books.get(returning.book_id) : undefined}
            member={returning ? view?.members.get(returning.member_id) : undefined}
            onReturned={reload}
          />
        </>
      )}
    </>
  );
}

function Figure({
  href,
  label,
  value,
  detail,
  tone,
}: {
  href: string;
  label: string;
  value: number | string;
  detail?: string;
  tone?: "overdue";
}) {
  return (
    <div className="group relative flex flex-col-reverse justify-end gap-1.5 bg-surface px-5 py-5 transition-colors hover:bg-paper">
      <dt className="text-sm text-ink-soft group-hover:text-ink">
        <Link href={href} className="after:absolute after:inset-0">
          {label}
        </Link>
        {detail && <span className="block text-ink-faint">{detail}</span>}
      </dt>
      <dd className={`font-serif text-[2rem] font-semibold leading-none tabular-nums ${tone === "overdue" ? "text-overdue" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function SectionHeading({ id, title, href, linkLabel }: { id: string; title: string; href: string; linkLabel: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 id={id} className="font-serif text-[1.3125rem] font-semibold">
        {title}
      </h2>
      <Link href={href} className="text-sm font-semibold text-stamp hover:underline">
        {linkLabel}
      </Link>
    </div>
  );
}

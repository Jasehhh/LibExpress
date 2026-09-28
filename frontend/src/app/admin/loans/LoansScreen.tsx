"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { fetchBooks } from "@/app/api/bookService";
import { fetchLoans } from "@/app/api/loanService";
import { fetchMembers } from "@/app/api/memberService";
import { CheckoutDialog, ReturnDialog } from "@/components/admin/Circulation";
import { useStaff } from "@/components/admin/StaffShell";
import { LoanStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FilterTabs, PageHeader, SearchBox } from "@/components/ui/Controls";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { Table, TBody, Td, Th, THead } from "@/components/ui/Table";
import { formatDate, fullName, plural } from "@/lib/format";
import { byDueDate, byId, isLate, isOpen } from "@/lib/loans";
import { daysLate, daysUntil, LOAN_PERIOD_DAYS } from "@/lib/rules";
import { useNow } from "@/lib/useNow";
import { useQuery } from "@/lib/useQuery";
import { Loan } from "@/lib/types/loan";

type View = "out" | "late" | "returned" | "all";

const VIEWS: View[] = ["out", "late", "returned", "all"];

export function LoansScreen() {
  const { token } = useStaff();
  const now = useNow();
  const params = useSearchParams();
  const initial = params.get("status") as View | null;
  const [view, setView] = useState<View>(initial && VIEWS.includes(initial) ? initial : "out");
  const [query, setQuery] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [returning, setReturning] = useState<Loan | null>(null);

  const load = useCallback(
    () =>
      Promise.all([fetchLoans(token), fetchBooks(), fetchMembers(token)]).then(([loans, books, members]) => ({
        loans,
        books,
        members,
      })),
    [token],
  );
  const { data, error, reload } = useQuery(load);

  const lookups = useMemo(() => ({ books: byId(data?.books), members: byId(data?.members) }), [data]);

  const counts = useMemo(() => {
    const loans = data?.loans ?? [];
    return {
      out: loans.filter(isOpen).length,
      late: loans.filter((loan) => isLate(loan, now)).length,
      returned: loans.filter((loan) => loan.status === "RETURNED").length,
      all: loans.length,
    };
  }, [data, now]);

  const loans = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = (data?.loans ?? []).filter((loan) => {
      if (view === "out" && !isOpen(loan)) return false;
      if (view === "late" && !isLate(loan, now)) return false;
      if (view === "returned" && loan.status !== "RETURNED") return false;
      if (!needle) return true;
      const book = lookups.books.get(loan.book_id);
      const member = lookups.members.get(loan.member_id);
      return `${book?.title ?? ""} ${member ? `${fullName(member)} ${member.email}` : ""}`.toLowerCase().includes(needle);
    });
    // Open loans by due date; returned loans newest first.
    return view === "returned" || view === "all"
      ? list.sort((a, b) => new Date(b.checkout_date).getTime() - new Date(a.checkout_date).getTime())
      : list.sort(byDueDate);
  }, [data, view, query, now, lookups]);

  return (
    <>
      <PageHeader
        title="Loans"
        description={`Books go out for ${LOAN_PERIOD_DAYS} days. Returning a book late adds a fine automatically.`}
        actions={
          <Button onClick={() => setCheckoutOpen(true)} disabled={!data}>
            Check out a book
          </Button>
        }
      />

      {error && !data && <ErrorState message={error.message} onRetry={reload} />}
      {!data && !error && <LoadingState label="Loading loans" />}

      {data && (
        <>
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
            <FilterTabs<View>
              label="Show loans"
              value={view}
              onChange={setView}
              options={[
                { value: "out", label: "Out now", count: counts.out },
                { value: "late", label: "Overdue", count: counts.late },
                { value: "returned", label: "Returned", count: counts.returned },
                { value: "all", label: "All", count: counts.all },
              ]}
            />
            <SearchBox value={query} onChange={setQuery} label="Search loans" placeholder="Search book or member" className="md:w-72" />
          </div>

          {data.loans.length === 0 ? (
            <EmptyState title="No loans yet" action={<Button onClick={() => setCheckoutOpen(true)}>Check out a book</Button>}>
              Check out a book to a member and it shows up here until it comes back.
            </EmptyState>
          ) : loans.length === 0 ? (
            <EmptyState title={view === "late" && !query ? "Nothing is overdue" : "No loans match"}>
              {view === "late" && !query ? "Every book out right now is still within its loan period." : "Try another search or view."}
            </EmptyState>
          ) : (
            <Table label="Loans">
              <THead>
                <Th>Book</Th>
                <Th>Member</Th>
                <Th>Checked out</Th>
                <Th>Due</Th>
                <Th>Status</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </THead>
              <TBody>
                {loans.map((loan) => {
                  const book = lookups.books.get(loan.book_id);
                  const member = lookups.members.get(loan.member_id);
                  const late = isLate(loan, now);
                  const days = daysUntil(loan.due_date, now);
                  return (
                    <tr key={loan.id} className="hover:bg-paper/60">
                      <Td className="font-semibold">{book?.title ?? "Removed book"}</Td>
                      <Td>
                        {member ? (
                          <Link href={`/admin/members/${member.id}`} className="hover:text-stamp hover:underline">
                            {fullName(member)}
                          </Link>
                        ) : (
                          <span className="text-ink-soft">Removed member</span>
                        )}
                      </Td>
                      <Td className="text-sm tabular-nums text-ink-soft">{formatDate(loan.checkout_date)}</Td>
                      <Td className="text-sm tabular-nums">
                        {loan.status === "RETURNED" ? (
                          <span className="text-ink-soft">
                            Returned {loan.return_date ? formatDate(loan.return_date) : ""}
                          </span>
                        ) : (
                          <>
                            <span className={late ? "font-semibold text-overdue" : ""}>{formatDate(loan.due_date)}</span>
                            <span className={`block text-xs ${late ? "text-overdue" : "text-ink-soft"}`}>
                              {late ? `${plural(daysLate(loan.due_date, new Date(now)), "day")} late` : days === 0 ? "Due today" : `In ${plural(days, "day")}`}
                            </span>
                          </>
                        )}
                      </Td>
                      <Td>
                        <LoanStatusBadge status={loan.status} pastDue={late} />
                      </Td>
                      <Td className="text-right">
                        {isOpen(loan) && (
                          <Button variant="secondary" size="sm" onClick={() => setReturning(loan)}>
                            Return
                          </Button>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </TBody>
            </Table>
          )}

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
            book={returning ? lookups.books.get(returning.book_id) : undefined}
            member={returning ? lookups.members.get(returning.member_id) : undefined}
            onReturned={reload}
          />
        </>
      )}
    </>
  );
}

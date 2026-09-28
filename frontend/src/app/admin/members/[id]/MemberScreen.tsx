"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { fetchBooks } from "@/app/api/bookService";
import { fetchMemberFines, patchFine } from "@/app/api/fineService";
import { fetchMemberLoans } from "@/app/api/loanService";
import { fetchMember } from "@/app/api/memberService";
import { CheckoutDialog, ReturnDialog } from "@/components/admin/Circulation";
import { MemberForm } from "@/components/admin/MemberForm";
import { useStaff } from "@/components/admin/StaffShell";
import { LoanStatusBadge, MemberStatusBadge, PaymentBadge, RoleBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Table, TBody, Td, Th, THead } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { ApiError, errorMessage } from "@/lib/client";
import { formatDate, formatMoney, fullName } from "@/lib/format";
import { activeLoanCounts, byId, isLate, isOpen } from "@/lib/loans";
import { FINE_PER_DAY, MAX_ACTIVE_LOANS } from "@/lib/rules";
import { useNow } from "@/lib/useNow";
import { useQuery } from "@/lib/useQuery";
import { Fine } from "@/lib/types/fine";
import { Loan } from "@/lib/types/loan";

export function MemberScreen({ id }: { id: string }) {
  const { token } = useStaff();
  const toast = useToast();
  const now = useNow();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [returning, setReturning] = useState<Loan | null>(null);
  const [updatingFine, setUpdatingFine] = useState<string | null>(null);

  const load = useCallback(
    () =>
      Promise.all([fetchMember(id, token), fetchMemberLoans(id, token), fetchMemberFines(id, token), fetchBooks()]).then(
        ([member, loans, fines, books]) => ({ member, loans, fines, books }),
      ),
    [id, token],
  );
  const { data, error, reload } = useQuery(load);

  const view = useMemo(() => {
    if (!data) return null;
    const byNewest = (a: Loan, b: Loan) => new Date(b.checkout_date).getTime() - new Date(a.checkout_date).getTime();
    return {
      books: byId(data.books),
      loans: byId(data.loans),
      open: data.loans.filter(isOpen).sort(byNewest),
      history: data.loans.filter((loan) => !isOpen(loan)).sort(byNewest),
      active: activeLoanCounts(data.loans).get(data.member.id) ?? 0,
      fines: [...data.fines].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    };
  }, [data]);

  async function toggleFine(fine: Fine) {
    setUpdatingFine(fine.id);
    try {
      const paid = fine.payment_status === "UNPAID";
      await patchFine(fine.id, { payment_status: paid ? "PAID" : "UNPAID" }, token);
      toast(paid ? `Marked ${formatMoney(fine.amount)} as paid` : `Marked ${formatMoney(fine.amount)} as unpaid`);
      reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setUpdatingFine(null);
    }
  }

  if (error && !data) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <>
        <BackLink />
        <ErrorState message={missing ? "This member doesn't exist. They may have been removed." : error.message} onRetry={missing ? undefined : reload} />
      </>
    );
  }
  if (!data || !view) {
    return (
      <>
        <BackLink />
        <LoadingState label="Loading member" />
      </>
    );
  }

  const { member } = data;
  const owes = Number(member.unpaid_fines_total) > 0;

  return (
    <>
      <BackLink />
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-[2.25rem] font-semibold leading-tight">{fullName(member)}</h1>
          <p className="mt-1 text-ink-soft">
            <a href={`mailto:${member.email}`} className="hover:text-stamp hover:underline">
              {member.email}
            </a>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <MemberStatusBadge status={member.status} />
            <RoleBadge role={member.role} />
            <span>Member since {formatDate(member.created_at)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            Edit member
          </Button>
          <Button onClick={() => setCheckoutOpen(true)} disabled={view.active >= MAX_ACTIVE_LOANS}>
            Check out a book
          </Button>
        </div>
      </header>

      {member.status === "SUSPENDED" && (
        <p className="mb-6 rounded-md border border-caution/30 bg-caution-wash px-4 py-3 text-[0.9375rem] text-caution">
          This member is suspended. Check with the library before lending them more books.
        </p>
      )}

      <dl className="mb-12 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-rule bg-rule">
        <div className="flex flex-col-reverse gap-1 bg-surface px-5 py-4">
          <dt className="text-sm text-ink-soft">Books out</dt>
          <dd className="font-serif text-[1.75rem] font-semibold leading-none tabular-nums">{view.open.length}</dd>
        </div>
        <div className="flex flex-col-reverse gap-1 bg-surface px-5 py-4">
          <dt className="text-sm text-ink-soft">Active loan limit</dt>
          <dd className="font-serif text-[1.75rem] font-semibold leading-none tabular-nums">
            {view.active}
            <span className="text-lg text-ink-faint"> of {MAX_ACTIVE_LOANS}</span>
          </dd>
        </div>
        <div className="flex flex-col-reverse gap-1 bg-surface px-5 py-4">
          <dt className="text-sm text-ink-soft">Unpaid fines</dt>
          <dd className={`font-serif text-[1.75rem] font-semibold leading-none tabular-nums ${owes ? "text-overdue" : ""}`}>
            {formatMoney(member.unpaid_fines_total)}
          </dd>
        </div>
      </dl>

      <div className="flex flex-col gap-12">
        <section aria-labelledby="out-heading">
          <h2 id="out-heading" className="mb-4 font-serif text-[1.3125rem] font-semibold">
            Books out
          </h2>
          {view.open.length === 0 ? (
            <p className="text-ink-soft">{member.first_name} has no books checked out.</p>
          ) : (
            <LoanTable loans={view.open} books={view.books} now={now} onReturn={setReturning} />
          )}
        </section>

        <section aria-labelledby="fines-heading">
          <h2 id="fines-heading" className="mb-4 font-serif text-[1.3125rem] font-semibold">
            Fines
          </h2>
          {view.fines.length === 0 ? (
            <p className="text-ink-soft">No fines. Late returns add {formatMoney(FINE_PER_DAY)} for each day late.</p>
          ) : (
            <Table label="Fines">
              <THead>
                <Th>Book</Th>
                <Th>Added</Th>
                <Th className="text-right">Amount</Th>
                <Th>Status</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </THead>
              <TBody>
                {view.fines.map((fine) => {
                  const loan = view.loans.get(fine.loan_id);
                  const book = loan ? view.books.get(loan.book_id) : undefined;
                  return (
                    <tr key={fine.id}>
                      <Td className="font-semibold">{book?.title ?? "Unknown book"}</Td>
                      <Td className="text-sm tabular-nums text-ink-soft">{formatDate(fine.created_at)}</Td>
                      <Td className="text-right tabular-nums">{formatMoney(fine.amount)}</Td>
                      <Td>
                        <PaymentBadge status={fine.payment_status} />
                      </Td>
                      <Td className="text-right">
                        <Button
                          variant={fine.payment_status === "UNPAID" ? "secondary" : "ghost"}
                          size="sm"
                          busy={updatingFine === fine.id}
                          onClick={() => toggleFine(fine)}
                        >
                          {fine.payment_status === "UNPAID" ? "Mark paid" : "Mark unpaid"}
                        </Button>
                      </Td>
                    </tr>
                  );
                })}
              </TBody>
            </Table>
          )}
        </section>

        <section aria-labelledby="history-heading">
          <h2 id="history-heading" className="mb-4 font-serif text-[1.3125rem] font-semibold">
            Loan history
          </h2>
          {view.history.length === 0 ? (
            <p className="text-ink-soft">No returned books yet.</p>
          ) : (
            <LoanTable loans={view.history} books={view.books} now={now} />
          )}
        </section>

        <p className="text-sm text-ink-soft">
          See every change to this member in the{" "}
          <Link href={`/admin/activity?entity=member&entity_id=${member.id}`} className="font-semibold text-stamp hover:underline">
            activity log
          </Link>
          .
        </p>
      </div>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit member">
        <MemberForm
          member={member}
          token={token}
          onCancel={() => setEditOpen(false)}
          onSaved={(saved) => {
            toast(`Saved ${fullName(saved)}`);
            setEditOpen(false);
            reload();
          }}
        />
      </Dialog>
      <CheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        token={token}
        books={data.books}
        members={[member]}
        loans={data.loans}
        memberId={member.id}
        onCheckedOut={reload}
      />
      <ReturnDialog
        loan={returning}
        onClose={() => setReturning(null)}
        token={token}
        book={returning ? view.books.get(returning.book_id) : undefined}
        member={member}
        onReturned={reload}
      />
    </>
  );
}

function BackLink() {
  return (
    <Link href="/admin/members" className="mb-6 inline-flex text-sm font-semibold text-stamp hover:underline">
      All members
    </Link>
  );
}

function LoanTable({
  loans,
  books,
  now,
  onReturn,
}: {
  loans: Loan[];
  books: Map<string, { title: string }>;
  now: number;
  onReturn?: (loan: Loan) => void;
}) {
  return (
    <Table label={onReturn ? "Books out" : "Loan history"}>
      <THead>
        <Th>Book</Th>
        <Th>Checked out</Th>
        <Th>{onReturn ? "Due" : "Returned"}</Th>
        <Th>Status</Th>
        {onReturn && (
          <Th>
            <span className="sr-only">Actions</span>
          </Th>
        )}
      </THead>
      <TBody>
        {loans.map((loan) => {
          const late = isLate(loan, now);
          return (
            <tr key={loan.id}>
              <Td className="font-semibold">{books.get(loan.book_id)?.title ?? "Unknown book"}</Td>
              <Td className="text-sm tabular-nums text-ink-soft">{formatDate(loan.checkout_date)}</Td>
              <Td className={`text-sm tabular-nums ${late ? "font-semibold text-overdue" : "text-ink-soft"}`}>
                {onReturn ? formatDate(loan.due_date) : loan.return_date ? formatDate(loan.return_date) : ""}
              </Td>
              <Td>
                <LoanStatusBadge status={loan.status} pastDue={late} />
              </Td>
              {onReturn && (
                <Td className="text-right">
                  <Button variant="secondary" size="sm" onClick={() => onReturn(loan)}>
                    Return
                  </Button>
                </Td>
              )}
            </tr>
          );
        })}
      </TBody>
    </Table>
  );
}

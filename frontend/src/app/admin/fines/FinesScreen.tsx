"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { fetchBooks } from "@/app/api/bookService";
import { fetchFines, patchFine } from "@/app/api/fineService";
import { fetchLoans } from "@/app/api/loanService";
import { fetchMembers } from "@/app/api/memberService";
import { useStaff } from "@/components/admin/StaffShell";
import { PaymentBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FilterTabs, PageHeader, SearchBox } from "@/components/ui/Controls";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { Table, TBody, Td, Th, THead } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/client";
import { formatDate, formatMoney, fullName, plural } from "@/lib/format";
import { byId } from "@/lib/loans";
import { FINE_PER_DAY } from "@/lib/rules";
import { useQuery } from "@/lib/useQuery";
import { Fine, PaymentStatus } from "@/lib/types/fine";

type View = PaymentStatus | "ALL";

export function FinesScreen() {
  const { token } = useStaff();
  const toast = useToast();
  const [view, setView] = useState<View>("UNPAID");
  const [query, setQuery] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(
    () =>
      Promise.all([fetchFines(token), fetchLoans(token), fetchMembers(token), fetchBooks()]).then(
        ([fines, loans, members, books]) => ({ fines, loans, members, books }),
      ),
    [token],
  );
  const { data, error, reload } = useQuery(load);

  const lookups = useMemo(
    () => ({ loans: byId(data?.loans), members: byId(data?.members), books: byId(data?.books) }),
    [data],
  );

  const summary = useMemo(() => {
    const fines = data?.fines ?? [];
    const unpaid = fines.filter((fine) => fine.payment_status === "UNPAID");
    const paid = fines.filter((fine) => fine.payment_status === "PAID");
    const sum = (list: Fine[]) => list.reduce((total, fine) => total + Number(fine.amount), 0);
    return { unpaid, paid, unpaidTotal: sum(unpaid), paidTotal: sum(paid) };
  }, [data]);

  const fines = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data?.fines ?? [])
      .filter((fine) => {
        if (view !== "ALL" && fine.payment_status !== view) return false;
        if (!needle) return true;
        const member = lookups.members.get(fine.member_id);
        const loan = lookups.loans.get(fine.loan_id);
        const book = loan ? lookups.books.get(loan.book_id) : undefined;
        return `${member ? fullName(member) : ""} ${book?.title ?? ""}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [data, view, query, lookups]);

  async function toggle(fine: Fine) {
    setUpdating(fine.id);
    const paid = fine.payment_status === "UNPAID";
    try {
      await patchFine(fine.id, { payment_status: paid ? "PAID" : "UNPAID" }, token);
      const member = lookups.members.get(fine.member_id);
      toast(
        paid
          ? `Recorded ${formatMoney(fine.amount)} paid${member ? ` by ${fullName(member)}` : ""}`
          : `Marked ${formatMoney(fine.amount)} as unpaid`,
      );
      reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Fines"
        description={`Returning a book late adds ${formatMoney(FINE_PER_DAY)} for each day. Record payments here.`}
      />

      {error && !data && <ErrorState message={error.message} onRetry={reload} />}
      {!data && !error && <LoadingState label="Loading fines" />}

      {data && (
        <>
          <dl className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-rule bg-rule sm:max-w-xl">
            <div className="flex flex-col-reverse gap-1 bg-surface px-5 py-4">
              <dt className="text-sm text-ink-soft">Still owed, {plural(summary.unpaid.length, "fine")}</dt>
              <dd
                className={`font-serif text-[1.75rem] font-semibold leading-none tabular-nums ${summary.unpaidTotal > 0 ? "text-overdue" : ""}`}
              >
                {formatMoney(summary.unpaidTotal)}
              </dd>
            </div>
            <div className="flex flex-col-reverse gap-1 bg-surface px-5 py-4">
              <dt className="text-sm text-ink-soft">Collected, {plural(summary.paid.length, "fine")}</dt>
              <dd className="font-serif text-[1.75rem] font-semibold leading-none tabular-nums">{formatMoney(summary.paidTotal)}</dd>
            </div>
          </dl>

          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
            <FilterTabs<View>
              label="Show fines"
              value={view}
              onChange={setView}
              options={[
                { value: "UNPAID", label: "Unpaid", count: summary.unpaid.length },
                { value: "PAID", label: "Paid", count: summary.paid.length },
                { value: "ALL", label: "All", count: data.fines.length },
              ]}
            />
            <SearchBox value={query} onChange={setQuery} label="Search fines" placeholder="Search member or book" className="md:w-72" />
          </div>

          {data.fines.length === 0 ? (
            <EmptyState title="No fines on record">Fines appear here when a book comes back after its due date.</EmptyState>
          ) : fines.length === 0 ? (
            <EmptyState title={view === "UNPAID" && !query ? "Nothing owed" : "No fines match"}>
              {view === "UNPAID" && !query ? "Every fine has been paid." : "Try another search or view."}
            </EmptyState>
          ) : (
            <Table label="Fines">
              <THead>
                <Th>Member</Th>
                <Th>Book</Th>
                <Th>Added</Th>
                <Th className="text-right">Amount</Th>
                <Th>Status</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </THead>
              <TBody>
                {fines.map((fine) => {
                  const member = lookups.members.get(fine.member_id);
                  const loan = lookups.loans.get(fine.loan_id);
                  const book = loan ? lookups.books.get(loan.book_id) : undefined;
                  const days = Math.round(Number(fine.amount) / FINE_PER_DAY);
                  return (
                    <tr key={fine.id} className="hover:bg-paper/60">
                      <Td>
                        {member ? (
                          <Link href={`/admin/members/${member.id}`} className="font-semibold hover:text-stamp hover:underline">
                            {fullName(member)}
                          </Link>
                        ) : (
                          <span className="text-ink-soft">Removed member</span>
                        )}
                      </Td>
                      <Td>
                        {book?.title ?? <span className="text-ink-soft">Removed book</span>}
                        <p className="text-sm text-ink-soft">{plural(days, "day")} late</p>
                      </Td>
                      <Td className="text-sm tabular-nums text-ink-soft">{formatDate(fine.created_at)}</Td>
                      <Td className="text-right font-semibold tabular-nums">{formatMoney(fine.amount)}</Td>
                      <Td>
                        <PaymentBadge status={fine.payment_status} />
                      </Td>
                      <Td className="text-right">
                        <Button
                          variant={fine.payment_status === "UNPAID" ? "secondary" : "ghost"}
                          size="sm"
                          busy={updating === fine.id}
                          onClick={() => toggle(fine)}
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
        </>
      )}
    </>
  );
}

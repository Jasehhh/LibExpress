"use client";

import { formatMoney } from "~/components/features/fines/money";
import { Dialog } from "~/components/ui/dialog";
import { Pill } from "~/components/ui/pill";
import { TIME_ZONE } from "~/lib/time";
import { type Member, type MemberLoan } from "~/lib/types";
import { api } from "~/trpc/react";

const day = new Intl.DateTimeFormat("en-PH", {
  timeZone: TIME_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
});

// A member's borrowing at a glance: every book they have had, and every
// fine those loans carried, with a way to record a payment.
export function MemberViewDialog({
  member,
  onClose,
}: {
  member: Member | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!member}
      onClose={onClose}
      size="lg"
      title={member ? `${member.firstName} ${member.lastName}` : "Member"}
      description={member?.email}
    >
      {member && <MemberHistory member={member} />}
    </Dialog>
  );
}

function MemberHistory({ member }: { member: Member }) {
  const history = api.loan.getHistory.useQuery({ memberId: member.id });
  const loans = history.data ?? [];
  const fines = loans.filter((loan) => loan.fine);

  return (
    <div className="grid grid-cols-1 gap-7">
      <dl className="bg-background border-border grid grid-cols-2 gap-4 rounded-xl border px-5 py-4 sm:grid-cols-4">
        <Fact label="Status">
          <Pill tone={member.status === "ACTIVE" ? "good" : "bad"}>
            {member.status === "ACTIVE" ? "Active" : "Suspended"}
          </Pill>
        </Fact>
        <Fact label="Member since">{day.format(member.createdAt)}</Fact>
        <Fact label="Books out">{member.activeLoansCount}</Fact>
        <Fact label="Unpaid fines">
          <span
            className={
              Number(member.unpaidFinesTotal) > 0 ? "text-danger" : undefined
            }
          >
            {formatMoney(member.unpaidFinesTotal)}
          </span>
        </Fact>
      </dl>

      {history.isPending ? (
        <p className="text-muted text-sm">Loading their loans…</p>
      ) : history.error ? (
        <p role="alert" className="text-danger text-sm">
          {history.error.message}
        </p>
      ) : (
        <>
          <section>
            <h3 className="text-navy font-semibold">
              Books borrowed{" "}
              <span className="text-muted font-normal">({loans.length})</span>
            </h3>
            {loans.length > 0 ? (
              <ul className="divide-border border-border mt-3 divide-y rounded-xl border">
                {loans.map((loan) => (
                  <li
                    key={loan.id}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-foreground text-sm font-semibold">
                        {loan.title}
                      </p>
                      <p className="text-muted text-xs">
                        Out {day.format(loan.checkoutDate)},{" "}
                        {loan.returnDate
                          ? `back ${day.format(loan.returnDate)}`
                          : `due ${day.format(loan.dueDate)}`}
                      </p>
                    </div>
                    <LoanPill loan={loan} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted mt-2 text-sm">
                This member hasn&apos;t borrowed anything yet.
              </p>
            )}
          </section>

          <section>
            <h3 className="text-navy font-semibold">
              Fines{" "}
              <span className="text-muted font-normal">({fines.length})</span>
            </h3>
            {fines.length > 0 ? (
              <ul className="divide-border border-border mt-3 divide-y rounded-xl border">
                {fines.map((loan) => (
                  <FineRow key={loan.fine!.id} loan={loan} />
                ))}
              </ul>
            ) : (
              <p className="text-muted mt-2 text-sm">
                No fines. Every book came back on time.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="text-foreground mt-1 text-sm font-semibold tabular-nums">
        {children}
      </dd>
    </div>
  );
}

function LoanPill({ loan }: { loan: MemberLoan }) {
  if (loan.status === "RETURNED") return <Pill tone="neutral">Returned</Pill>;
  if (loan.status === "OVERDUE") {
    return (
      <Pill tone="bad">
        {loan.daysLate} {loan.daysLate === 1 ? "day" : "days"} late
      </Pill>
    );
  }
  return <Pill tone="info">Out now</Pill>;
}

function FineRow({ loan }: { loan: MemberLoan }) {
  const utils = api.useUtils();
  const fine = loan.fine!;
  const pay = api.fine.update.useMutation({
    onSuccess: () =>
      Promise.all([
        utils.loan.invalidate(),
        utils.member.getAll.invalidate(),
        utils.dashboard.invalidate(),
      ]),
  });

  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="text-foreground text-sm font-semibold tabular-nums">
          {formatMoney(fine.amount)}
        </p>
        <p className="text-muted text-xs">
          {loan.title}
          {fine.paidAt && `, paid ${day.format(fine.paidAt)}`}
        </p>
        {pay.error && (
          <p role="alert" className="text-danger mt-1 text-xs">
            {pay.error.message}
          </p>
        )}
      </div>
      {fine.paidAt ? (
        <Pill tone="good">Paid</Pill>
      ) : (
        <div className="flex shrink-0 items-center gap-3">
          <Pill tone="bad">Unpaid</Pill>
          <button
            type="button"
            disabled={pay.isPending}
            onClick={() => pay.mutate({ id: fine.id, paymentStatus: "PAID" })}
            className="text-navy focus-visible:ring-primary-light rounded text-sm font-semibold underline underline-offset-4 hover:no-underline focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
          >
            {pay.isPending ? "Saving…" : "Mark paid"}
          </button>
        </div>
      )}
    </li>
  );
}

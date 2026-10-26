"use client";

import { useId, useState } from "react";

import { Panel } from "~/components/admin/panel";
import { formatMoney } from "~/components/features/fines/money";
import { BookIcon } from "~/components/features/loans/checkout-form";
import { Combobox } from "~/components/ui/combobox";
import { BUTTON_CLASS, FormField } from "~/components/ui/form-field";
import { Pill } from "~/components/ui/pill";
import { type OpenLoan } from "~/lib/types";
import { api } from "~/trpc/react";

const shortDate = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
});

const memberName = (loan: OpenLoan) =>
  `${loan.member.firstName} ${loan.member.lastName}`;

// A late return writes a fine; the desk then takes payment or leaves it on
// the member's account.
type Step =
  | { kind: "pick" }
  | {
      kind: "pay";
      fineId: string;
      amount: string;
      title: string;
      member: string;
    }
  | { kind: "done"; message: string };

export function ReturnForm() {
  const ids = useId();
  const utils = api.useUtils();
  const [loans] = api.loan.getOpen.useSuspenseQuery(undefined, {
    refetchInterval: 60_000,
  });
  const [loan, setLoan] = useState<OpenLoan | null>(null);
  const [step, setStep] = useState<Step>({ kind: "pick" });

  const refresh = () =>
    Promise.all([
      utils.loan.invalidate(),
      utils.book.getAll.invalidate(),
      utils.member.getAll.invalidate(),
      utils.dashboard.invalidate(),
    ]);

  const giveBack = api.loan.return.useMutation({
    onSuccess: async ({ fine }) => {
      const title = loan?.title ?? "The book";
      const member = loan ? memberName(loan) : "the member";
      setLoan(null);
      setStep(
        fine
          ? { kind: "pay", fineId: fine.id, amount: fine.amount, title, member }
          : { kind: "done", message: `${title} returned by ${member}.` },
      );
      await refresh();
    },
    onError: () => utils.loan.getOpen.invalidate(),
  });

  const pay = api.fine.update.useMutation({
    onSuccess: async () => {
      if (step.kind === "pay") {
        setStep({
          kind: "done",
          message: `${step.title} returned. ${step.member} paid the ${formatMoney(step.amount)} fine.`,
        });
      }
      await refresh();
    },
  });

  if (step.kind === "pay") {
    return (
      <Panel title="Return">
        <div className="flex flex-1 flex-col gap-5 px-5 pt-2 pb-6 sm:px-6">
          <p className="text-sm">
            <span className="font-semibold">{step.title}</span> is back. It came
            in late, so {step.member} owes a fine.
          </p>
          <div className="bg-danger-light/60 rounded-xl px-5 py-4">
            <p className="text-danger text-sm font-medium">Fine to collect</p>
            <p className="text-danger mt-1 text-3xl font-bold tabular-nums">
              {formatMoney(step.amount)}
            </p>
          </div>
          {pay.error && (
            <p role="alert" className="text-danger text-sm">
              {pay.error.message}
            </p>
          )}
          <div className="mt-auto grid gap-3">
            <button
              type="button"
              disabled={pay.isPending}
              onClick={() =>
                pay.mutate({ id: step.fineId, paymentStatus: "PAID" })
              }
              className={`${BUTTON_CLASS.primary} w-full py-3`}
            >
              {pay.isPending
                ? "Recording payment…"
                : `Payment received, ${formatMoney(step.amount)}`}
            </button>
            <button
              type="button"
              disabled={pay.isPending}
              onClick={() =>
                setStep({
                  kind: "done",
                  message: `${step.title} returned. The ${formatMoney(step.amount)} fine stays on ${step.member}'s account.`,
                })
              }
              className={`${BUTTON_CLASS.secondary} w-full py-3`}
            >
              Collect later
            </button>
          </div>
        </div>
      </Panel>
    );
  }

  const late = loan && loan.daysLate > 0;

  return (
    <Panel title="Return">
      <form
        className="flex flex-1 flex-col gap-5 px-5 pt-2 pb-6 sm:px-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (!loan) return;
          giveBack.mutate({ id: loan.id });
        }}
      >
        <FormField label="Book out on loan" htmlFor={`${ids}-loan`}>
          <Combobox
            id={`${ids}-loan`}
            placeholder="Type a book, member name or email"
            items={loans}
            itemKey={(l) => l.id}
            searchText={(l) =>
              `${l.title} ${l.isbn} ${memberName(l)} ${l.member.email}`
            }
            selected={loan}
            onSelect={(l) => {
              setLoan(l);
              setStep({ kind: "pick" });
              giveBack.reset();
            }}
            noMatches="No book out on loan matches that."
            icon={<BookIcon />}
            renderItem={(l) => (
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="text-foreground block truncate text-sm font-semibold">
                    {l.title}
                  </span>
                  <span className="text-muted block truncate text-xs">
                    {memberName(l)}, {l.member.email}
                  </span>
                </span>
                {l.daysLate > 0 ? (
                  <Pill tone="bad">
                    {l.daysLate} {l.daysLate === 1 ? "day" : "days"} late
                  </Pill>
                ) : (
                  <Pill tone="neutral">Due {shortDate.format(l.dueDate)}</Pill>
                )}
              </div>
            )}
          />
        </FormField>

        <dl className="bg-background border-border grid gap-2 rounded-xl border px-5 py-4 text-sm">
          <dt className="text-foreground font-semibold">Fine check</dt>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Status</dt>
            <dd
              className={`font-semibold ${late ? "text-danger" : "text-foreground"}`}
            >
              {!loan
                ? "Pick a book first"
                : late
                  ? `Overdue (${loan.daysLate} ${loan.daysLate === 1 ? "day" : "days"})`
                  : `On time, due ${shortDate.format(loan.dueDate)}`}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted">Amount due</dt>
            <dd className="text-foreground text-xl font-bold tabular-nums">
              {formatMoney(loan?.fineDue ?? 0)}
            </dd>
          </div>
        </dl>

        {giveBack.error && (
          <p
            role="alert"
            className="bg-danger-light text-danger rounded-lg px-3 py-2 text-sm"
          >
            {giveBack.error.message}
          </p>
        )}
        {step.kind === "done" && (
          <p
            role="status"
            className="bg-success-light text-success rounded-lg px-3 py-2 text-sm font-medium"
          >
            {step.message}
          </p>
        )}

        <button
          type="submit"
          disabled={!loan || giveBack.isPending}
          className={`${late ? BUTTON_CLASS.danger : BUTTON_CLASS.primary} mt-auto w-full py-3`}
        >
          {giveBack.isPending
            ? "Processing…"
            : late
              ? `Process return and charge ${formatMoney(loan.fineDue)}`
              : "Process return"}
        </button>
      </form>
    </Panel>
  );
}

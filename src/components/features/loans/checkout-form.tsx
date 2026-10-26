"use client";

import { useId, useState } from "react";

import { Panel } from "~/components/admin/panel";
import { authorNames } from "~/components/features/books/book-cover";
import { formatMoney } from "~/components/features/fines/money";
import { Combobox } from "~/components/ui/combobox";
import { BUTTON_CLASS, FormField } from "~/components/ui/form-field";
import { Pill } from "~/components/ui/pill";
import { dueDateFor, LOAN_PERIOD_DAYS } from "~/lib/schemas/loan";
import { TIME_ZONE } from "~/lib/time";
import { type Book, type Member } from "~/lib/types";
import { api } from "~/trpc/react";

const longDate = new Intl.DateTimeFormat("en-PH", {
  timeZone: TIME_ZONE,
  month: "long",
  day: "numeric",
  year: "numeric",
});

const fullName = (member: Member) => `${member.firstName} ${member.lastName}`;

// Why the desk can't lend to this member, before the server is asked.
const memberBlock = (member: Member) =>
  member.status === "SUSPENDED" ? "This member is suspended." : null;

export function CheckoutForm() {
  const ids = useId();
  const utils = api.useUtils();
  const [books] = api.book.getAll.useSuspenseQuery();
  const [members] = api.member.getAll.useSuspenseQuery();
  const [book, setBook] = useState<Book | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const dueDate = dueDateFor(new Date());

  const checkout = api.loan.create.useMutation({
    onSuccess: async (loan) => {
      setDone(
        `${book?.title} (copy ${loan.copyNo}) checked out to ${member ? fullName(member) : "the member"}. Due back ${longDate.format(loan.dueDate)}.`,
      );
      setBook(null);
      setMember(null);
      await Promise.all([
        utils.book.getAll.invalidate(),
        utils.member.getAll.invalidate(),
        utils.loan.invalidate(),
        utils.dashboard.invalidate(),
      ]);
    },
    onError: () =>
      Promise.all([
        utils.book.getAll.invalidate(),
        utils.member.getAll.invalidate(),
      ]),
  });

  const blocked =
    (book?.availableCopies === 0 ? "Every copy of this book is out." : null) ??
    (member ? memberBlock(member) : null);

  return (
    <Panel title="Checkout">
      <form
        className="flex flex-1 flex-col gap-5 px-5 pt-2 pb-6 sm:px-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (!book || !member || blocked) return;
          setDone(null);
          checkout.mutate({ bookId: book.id, memberId: member.id });
        }}
      >
        <FormField label="Book" htmlFor={`${ids}-book`}>
          <Combobox
            id={`${ids}-book`}
            placeholder="Type a title, author or ISBN"
            items={books}
            itemKey={(b) => b.id}
            searchText={(b) => `${b.title} ${authorNames(b)} ${b.isbn}`}
            selected={book}
            onSelect={(b) => {
              setBook(b);
              setDone(null);
              checkout.reset();
            }}
            noMatches="No book matches that."
            icon={<BookIcon />}
            renderItem={(b) => (
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="text-foreground block truncate text-sm font-semibold">
                    {b.title}
                  </span>
                  <span className="text-muted block truncate text-xs">
                    {authorNames(b)}, ISBN {b.isbn}
                  </span>
                </span>
                {b.availableCopies > 0 ? (
                  <Pill tone="good">{b.availableCopies} available</Pill>
                ) : (
                  <Pill tone="bad">All out</Pill>
                )}
              </div>
            )}
          />
        </FormField>

        <FormField label="Member" htmlFor={`${ids}-member`}>
          <Combobox
            id={`${ids}-member`}
            placeholder="Type a name or email"
            items={members}
            itemKey={(m) => m.id}
            searchText={(m) => `${fullName(m)} ${m.email}`}
            selected={member}
            onSelect={(m) => {
              setMember(m);
              setDone(null);
              checkout.reset();
            }}
            noMatches="No member matches that."
            icon={<PersonIcon />}
            renderItem={(m) => (
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="text-foreground block truncate text-sm font-semibold">
                    {fullName(m)}
                  </span>
                  <span className="text-muted block truncate text-xs">
                    {m.email}
                  </span>
                </span>
                {m.status === "SUSPENDED" ? (
                  <Pill tone="bad">Suspended</Pill>
                ) : Number(m.unpaidFinesTotal) > 0 ? (
                  <Pill tone="bad">{formatMoney(m.unpaidFinesTotal)} owed</Pill>
                ) : (
                  <Pill tone="neutral">
                    {m.activeLoansCount}{" "}
                    {m.activeLoansCount === 1 ? "book" : "books"} out
                  </Pill>
                )}
              </div>
            )}
          />
        </FormField>

        {/* Set by the loan period, so it is shown, not a field to edit. */}
        <dl className="bg-background border-border flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm">
          <dt className="text-muted">
            Due date{" "}
            <span className="text-xs">({LOAN_PERIOD_DAYS}-day loan)</span>
          </dt>
          <dd className="text-foreground font-semibold">
            {longDate.format(dueDate)}
          </dd>
        </dl>

        {(blocked ?? checkout.error) && (
          <p
            role="alert"
            className="bg-danger-light text-danger rounded-lg px-3 py-2 text-sm"
          >
            {blocked ?? checkout.error?.message}
          </p>
        )}
        {done && (
          <p
            role="status"
            className="bg-success-light text-success rounded-lg px-3 py-2 text-sm font-medium"
          >
            {done}
          </p>
        )}

        <button
          type="submit"
          disabled={!book || !member || !!blocked || checkout.isPending}
          className={`${BUTTON_CLASS.primary} mt-auto w-full py-3`}
        >
          {checkout.isPending ? "Checking out…" : "Process checkout"}
        </button>
      </form>
    </Panel>
  );
}

export function BookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4.5h9a3 3 0 0 1 3 3v12H9a3 3 0 0 1-3-3v-12ZM6 16.5a3 3 0 0 1 3-3h9" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

"use client";

import { FormEvent, useMemo, useState } from "react";
import { patchLoan, postLoan } from "@/app/api/loanService";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogActions } from "@/components/ui/Dialog";
import { FormError, TextField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { ApiError, errorMessage } from "@/lib/client";
import { formatDate, formatDateTime, formatMoney, fullName, plural, toDateTimeLocal } from "@/lib/format";
import { activeLoanCounts } from "@/lib/loans";
import { daysLate, FINE_PER_DAY, LOAN_PERIOD_DAYS, MAX_ACTIVE_LOANS } from "@/lib/rules";
import { Book } from "@/lib/types/book";
import { Loan, ReturnLoanResult } from "@/lib/types/loan";
import { Member } from "@/lib/types/member";
import { SearchPicker } from "./SearchPicker";

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  token: string;
  books: Book[];
  members: Member[];
  loans: Loan[];
  memberId?: string;
  bookId?: string;
  onCheckedOut: (loan: Loan) => void;
}

export function CheckoutDialog({ open, onClose, ...props }: CheckoutDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Check out a book"
      description={`Loans are due back in ${LOAN_PERIOD_DAYS} days. A member can have ${MAX_ACTIVE_LOANS} active loans at a time.`}
      size="lg"
    >
      <CheckoutForm onClose={onClose} {...props} />
    </Dialog>
  );
}

function CheckoutForm({
  onClose,
  token,
  books,
  members,
  loans,
  memberId: initialMember = "",
  bookId: initialBook = "",
  onCheckedOut,
}: Omit<CheckoutDialogProps, "open">) {
  const [memberId, setMemberId] = useState(initialMember);
  const [bookId, setBookId] = useState(initialBook);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loan, setLoan] = useState<Loan | null>(null);

  const activeCounts = useMemo(() => activeLoanCounts(loans), [loans]);

  const memberItems = useMemo(
    () =>
      [...members]
        .sort((a, b) => fullName(a).localeCompare(fullName(b)))
        .map((member) => {
          const active = activeCounts.get(member.id) ?? 0;
          const atLimit = active >= MAX_ACTIVE_LOANS;
          return {
            id: member.id,
            title: fullName(member),
            detail: member.email,
            search: `${fullName(member)} ${member.email}`.toLowerCase(),
            disabled: atLimit,
            note: atLimit ? (
              <Badge tone="overdue">At loan limit</Badge>
            ) : member.status === "SUSPENDED" ? (
              <Badge tone="caution">Suspended</Badge>
            ) : (
              <span className="tabular-nums text-ink-soft">
                {active} of {MAX_ACTIVE_LOANS}
              </span>
            ),
          };
        }),
    [members, activeCounts],
  );

  const bookItems = useMemo(
    () =>
      books.map((book) => ({
        id: book.id,
        title: book.title,
        detail: `${fullName(book.author)}, ISBN ${book.isbn}`,
        search: `${book.title} ${fullName(book.author)} ${book.isbn}`.toLowerCase(),
        disabled: book.available_copies <= 0,
        note:
          book.available_copies > 0 ? (
            <span className="tabular-nums text-shelf">{book.available_copies} on shelf</span>
          ) : (
            <Badge tone="overdue">All out</Badge>
          ),
      })),
    [books],
  );

  const member = members.find((m) => m.id === memberId);
  const book = books.find((b) => b.id === bookId);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!memberId) errors.member_id = "Choose who is borrowing the book.";
    if (!bookId) errors.book_id = "Choose a book.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setBusy(true);
    setError(null);
    try {
      const created = await postLoan({ member_id: memberId, book_id: bookId }, token);
      setLoan(created);
      onCheckedOut(created);
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiError) setFieldErrors(err.fieldErrors);
    } finally {
      setBusy(false);
    }
  }

  if (loan && member && book) {
    return (
      <>
        <DueSlip loan={loan} book={book} member={member} />
        <DialogActions>
          <Button
            variant="secondary"
            onClick={() => {
              setLoan(null);
              setBookId("");
            }}
          >
            Check out another for {member.first_name}
          </Button>
          <Button onClick={onClose}>Done</Button>
        </DialogActions>
      </>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-5 md:grid-cols-2">
        <SearchPicker
          label="Member"
          items={memberItems}
          value={memberId}
          onChange={setMemberId}
          placeholder="Name or email"
          emptyText="No members match. Add the member first on the Members page."
          error={fieldErrors.member_id}
        />
        <SearchPicker
          label="Book"
          items={bookItems}
          value={bookId}
          onChange={setBookId}
          placeholder="Title, author or ISBN"
          emptyText="No books match."
          error={fieldErrors.book_id}
        />
      </div>
      <div className="mt-5">
        <FormError message={error} />
      </div>
      <DialogActions>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" busy={busy}>
          Check out
        </Button>
      </DialogActions>
    </form>
  );
}

// The date-due slip librarians stamp inside the back cover.
export function DueSlip({ loan, book, member }: { loan: Loan; book: Book; member: Member }) {
  return (
    <div className="catalog-card animate-slip overflow-hidden px-6 pb-7 pt-4">
      <div className="flex h-10 items-start justify-between text-sm text-ink-soft">
        <span>Checked out {formatDateTime(loan.checkout_date)}</span>
        <span className="hidden sm:inline">Please return by</span>
      </div>
      <div className="grid gap-6 pt-7 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="leading-7">
          <p className="font-serif text-xl font-semibold leading-7">{book.title}</p>
          <p className="text-ink-soft">{fullName(book.author)}</p>
          <p className="mt-7">
            Borrowed by <span className="font-semibold">{fullName(member)}</span>
          </p>
        </div>
        <div className="flex justify-center py-2 sm:justify-end">
          <div className="date-stamp animate-stamp text-center">
            <span className="block text-xs font-semibold">Date due</span>
            <span className="block font-serif text-2xl font-bold tabular-nums leading-tight">
              {formatDate(loan.due_date)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ReturnDialogProps {
  loan: Loan | null;
  onClose: () => void;
  token: string;
  book?: Book;
  member?: Member;
  onReturned: (result: ReturnLoanResult) => void;
}

export function ReturnDialog({ loan, onClose, ...props }: ReturnDialogProps) {
  return (
    <Dialog open={loan !== null} onClose={onClose} title="Return a book">
      {loan && <ReturnForm loan={loan} onClose={onClose} {...props} />}
    </Dialog>
  );
}

function ReturnForm({
  loan,
  onClose,
  token,
  book,
  member,
  onReturned,
}: Omit<ReturnDialogProps, "loan"> & { loan: Loan }) {
  const [returnedAt, setReturnedAt] = useState(() => toDateTimeLocal(new Date()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnLoanResult | null>(null);
  const toast = useToast();

  const returnDate = returnedAt ? new Date(returnedAt) : null;
  const late = returnDate ? daysLate(loan.due_date, returnDate) : 0;
  const beforeCheckout = returnDate !== null && returnDate < new Date(loan.checkout_date);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!returnDate) {
      setError("Enter the date the book came back.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const returned = await patchLoan(loan.id, { return_date: returnDate.toISOString() }, token);
      setResult(returned);
      onReturned(returned);
      if (!returned.fine) {
        toast(`${book?.title ?? "Book"} returned`);
        onClose();
      }
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  if (result?.fine) {
    return (
      <>
        <div className="rounded-md border border-overdue/30 bg-overdue-wash px-5 py-4">
          <p className="font-semibold text-overdue">
            Returned {plural(late, "day")} late
          </p>
          <p className="mt-1 text-ink-soft">
            A fine of <span className="font-semibold text-ink">{formatMoney(result.fine.amount)}</span> was added
            {member ? ` to ${fullName(member)}'s account` : ""}. Record the payment on the Fines page.
          </p>
        </div>
        <DialogActions>
          <Button onClick={onClose}>Done</Button>
        </DialogActions>
      </>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[0.9375rem]">
        <dt className="text-ink-soft">Book</dt>
        <dd className="font-semibold">{book?.title ?? "Unknown book"}</dd>
        <dt className="text-ink-soft">Member</dt>
        <dd>{member ? fullName(member) : "Unknown member"}</dd>
        <dt className="text-ink-soft">Checked out</dt>
        <dd className="tabular-nums">{formatDateTime(loan.checkout_date)}</dd>
        <dt className="text-ink-soft">Due</dt>
        <dd className="tabular-nums">{formatDateTime(loan.due_date)}</dd>
      </dl>

      <TextField
        label="Returned on"
        type="datetime-local"
        value={returnedAt}
        min={toDateTimeLocal(new Date(loan.checkout_date))}
        onChange={(event) => setReturnedAt(event.target.value)}
        containerClassName="mt-6"
        required
        error={beforeCheckout ? "The return date can't be before the checkout date." : undefined}
        hint={
          late > 0
            ? `${plural(late, "day")} late. This adds a fine of ${formatMoney(late * FINE_PER_DAY)} (${formatMoney(FINE_PER_DAY)} a day).`
            : "On time. No fine."
        }
      />
      <div className="mt-5">
        <FormError message={error} />
      </div>
      <DialogActions>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" busy={busy} disabled={beforeCheckout}>
          Return book
        </Button>
      </DialogActions>
    </form>
  );
}

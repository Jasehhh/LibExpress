import { Prisma } from "../../../generated/prisma";

import { type PaymentStatus } from "~/lib/schemas/fine";
import { type LoanStatus } from "~/lib/schemas/loan";

type Db = Prisma.TransactionClient;

export const OPEN_LOAN = { returnDate: null } satisfies Prisma.LoanWhereInput;

export const loanStatus = (
  loan: { dueDate: Date; returnDate: Date | null },
  now = new Date(),
): LoanStatus =>
  loan.returnDate ? "RETURNED" : loan.dueDate < now ? "OVERDUE" : "ACTIVE";

export const withLoanStatus = <
  T extends { dueDate: Date; returnDate: Date | null },
>(
  loan: T,
) => ({ ...loan, status: loanStatus(loan) });

export const paymentStatus = (fine: { paidAt: Date | null }): PaymentStatus =>
  fine.paidAt ? "PAID" : "UNPAID";

export const BOOK_INCLUDE = {
  authors: {
    include: { author: true },
    orderBy: [
      { author: { lastName: "asc" } },
      { author: { firstName: "asc" } },
    ],
  },
  copies: {
    where: { withdrawnAt: null },
    orderBy: { copyNo: "asc" },
    select: {
      copyNo: true,
      _count: { select: { loans: { where: OPEN_LOAN } } },
    },
  },
} satisfies Prisma.BookInclude;

export type BookWithIncludes = Prisma.BookGetPayload<{
  include: typeof BOOK_INCLUDE;
}>;

export const serializeBook = ({
  authors,
  copies,
  ...book
}: BookWithIncludes) => ({
  ...book,
  authors: authors.map((link) => link.author),
  totalCopies: copies.length,
  availableCopies: copies.filter((copy) => copy._count.loans === 0).length,
});

export const bookLogRow = ({ authors, copies, ...book }: BookWithIncludes) => ({
  ...book,
  authorIds: authors.map((link) => link.authorId),
  totalCopies: copies.length,
});

export const FINE_INCLUDE = {
  loan: { select: { memberId: true } },
} satisfies Prisma.FineInclude;

type FineWithMember = Prisma.FineGetPayload<{ include: typeof FINE_INCLUDE }>;

export const serializeFine = ({ loan, ...fine }: FineWithMember) => ({
  ...fine,
  memberId: loan.memberId,
  amount: fine.amount.toFixed(2),
  paymentStatus: paymentStatus(fine),
});

export async function unpaidFinesTotal(db: Db, memberId: string) {
  const { _sum } = await db.fine.aggregate({
    where: { paidAt: null, loan: { memberId } },
    _sum: { amount: true },
  });
  return _sum.amount ?? new Prisma.Decimal(0);
}

export async function withMemberTotals<T extends { id: string }>(
  db: Db,
  members: T[],
) {
  const ids = members.map((member) => member.id);

  const openLoans = await db.loan.groupBy({
    by: ["memberId"],
    where: { memberId: { in: ids }, ...OPEN_LOAN },
    _count: { _all: true },
  });
  const unpaidFines = await db.fine.findMany({
    where: { paidAt: null, loan: { memberId: { in: ids } } },
    select: { amount: true, loan: { select: { memberId: true } } },
  });

  const loanCounts = new Map(
    openLoans.map((row) => [row.memberId, row._count._all]),
  );
  const fineTotals = new Map<string, Prisma.Decimal>();
  for (const fine of unpaidFines) {
    const memberId = fine.loan.memberId;
    const total = fineTotals.get(memberId) ?? new Prisma.Decimal(0);
    fineTotals.set(memberId, total.add(fine.amount));
  }

  return members.map((member) => ({
    ...member,
    activeLoansCount: loanCounts.get(member.id) ?? 0,
    unpaidFinesTotal: (
      fineTotals.get(member.id) ?? new Prisma.Decimal(0)
    ).toFixed(2),
  }));
}

export async function withMemberTotal<T extends { id: string }>(
  db: Db,
  member: T,
) {
  const [result] = await withMemberTotals(db, [member]);
  return result ?? { ...member, activeLoansCount: 0, unpaidFinesTotal: "0.00" };
}

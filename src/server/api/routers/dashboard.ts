import { Prisma } from "../../../../generated/prisma";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { daysLate, FINE_PER_DAY } from "~/lib/schemas/loan";
import { BOOK_INCLUDE, OPEN_LOAN, serializeBook } from "~/server/lib/derived";

const DUE_SOON_DAYS = 7;
const OVERDUE_LIST_SIZE = 6;
const FEED_SIZE = 20;
const CIRCULATION_MONTHS = 6;
const POPULAR_LIST_SIZE = 4;

const LOAN_NAMES = {
  copy: { select: { book: { select: { title: true } } } },
  member: { select: { firstName: true, lastName: true } },
} satisfies Prisma.LoanSelect;

type Name = { firstName: string; lastName: string };
const fullName = (person: Name) => `${person.firstName} ${person.lastName}`;

type Snapshot = Record<string, unknown>;

// Activity details hold { before, after } copies of the row; merged, they
// still name a book or member after it has been deleted.
const snapshot = (details: Prisma.JsonValue): Snapshot => {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return {};
  }
  const { before, after } = details as { before?: Snapshot; after?: Snapshot };
  return { ...before, ...after };
};

const text = (value: unknown) => (typeof value === "string" ? value : null);

type ActivityKind =
  "added" | "checkout" | "return" | "fine" | "paid" | "unpaid";

export const dashboardRouter = createTRPCRouter({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const soon = new Date(now);
    soon.setDate(soon.getDate() + DUE_SOON_DAYS);

    const [titles, members, copies, borrowed, dueSoon, overdueLoans, unpaid] =
      await ctx.db.$transaction(
        [
          ctx.db.book.count(),
          ctx.db.member.count({ where: { status: "ACTIVE" } }),
          ctx.db.bookCopy.count({ where: { withdrawnAt: null } }),
          ctx.db.loan.count({ where: OPEN_LOAN }),
          ctx.db.loan.count({
            where: { ...OPEN_LOAN, dueDate: { gte: now, lt: soon } },
          }),
          ctx.db.loan.findMany({
            where: { ...OPEN_LOAN, dueDate: { lt: now } },
            select: { dueDate: true },
          }),
          ctx.db.fine.aggregate({
            where: { paidAt: null },
            _sum: { amount: true },
            _count: { _all: true },
          }),
        ],
        { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
      );

    // Fines are only written when a late book comes back, so books still
    // out past their due date are counted separately as accruing.
    const accruing = overdueLoans.reduce(
      (sum, loan) => sum + daysLate(loan.dueDate, now) * FINE_PER_DAY,
      0,
    );

    return {
      titles,
      members,
      copies,
      borrowed,
      dueSoon,
      dueSoonDays: DUE_SOON_DAYS,
      overdue: overdueLoans.length,
      unpaidFines: (unpaid._sum.amount ?? new Prisma.Decimal(0)).toFixed(2),
      unpaidFinesCount: unpaid._count._all,
      accruingFines: accruing.toFixed(2),
    };
  }),

  // Checkouts and returns per calendar month, oldest month first.
  circulation: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const start = new Date(
      now.getFullYear(),
      now.getMonth() - (CIRCULATION_MONTHS - 1),
      1,
    );

    const loans = await ctx.db.loan.findMany({
      where: {
        OR: [{ checkoutDate: { gte: start } }, { returnDate: { gte: start } }],
      },
      select: { checkoutDate: true, returnDate: true },
    });

    const months = Array.from({ length: CIRCULATION_MONTHS }, (_, i) => ({
      month: new Date(start.getFullYear(), start.getMonth() + i, 1),
      checkouts: 0,
      returns: 0,
    }));
    const slot = (date: Date) => {
      const index =
        (date.getFullYear() - start.getFullYear()) * 12 +
        date.getMonth() -
        start.getMonth();
      return index >= 0 ? months[index] : undefined;
    };

    // A date outside the window (a return keyed in for a future day) has no
    // slot and is skipped.
    for (const loan of loans) {
      const out = slot(loan.checkoutDate);
      if (out) out.checkouts++;
      const back = loan.returnDate && slot(loan.returnDate);
      if (back) back.returns++;
    }
    return months;
  }),

  popularBooks: protectedProcedure.query(async ({ ctx }) => {
    const counts = await ctx.db.loan.groupBy({
      by: ["bookId"],
      _count: { _all: true },
      orderBy: { _count: { bookId: "desc" } },
      take: POPULAR_LIST_SIZE,
    });
    const books = await ctx.db.book.findMany({
      where: { id: { in: counts.map((row) => row.bookId) } },
      include: BOOK_INCLUDE,
    });

    return counts.flatMap((row) => {
      const book = books.find((b) => b.id === row.bookId);
      return book ? [{ ...serializeBook(book), loans: row._count._all }] : [];
    });
  }),

  overdueLoans: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const loans = await ctx.db.loan.findMany({
      where: { ...OPEN_LOAN, dueDate: { lt: now } },
      orderBy: { dueDate: "asc" },
      take: OVERDUE_LIST_SIZE,
      select: { id: true, bookId: true, dueDate: true, ...LOAN_NAMES },
    });

    return loans.map((loan) => {
      const days = daysLate(loan.dueDate, now);
      return {
        id: loan.id,
        bookId: loan.bookId,
        title: loan.copy.book.title,
        member: fullName(loan.member),
        dueDate: loan.dueDate,
        daysLate: days,
        accruing: (days * FINE_PER_DAY).toFixed(2),
      };
    });
  }),

  // The desk's feed: books added to the catalog, checkouts and returns, and
  // fines with their payments. Edits, members and authors stay out of it.
  activity: protectedProcedure.query(async ({ ctx }) => {
    const logs = await ctx.db.activityLog.findMany({
      where: {
        OR: [
          { entity: "book", action: "CREATE" },
          { entity: "loan" },
          { entity: "fine" },
        ],
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: FEED_SIZE,
      include: { admin: { select: { email: true } } },
    });

    const idsOf = (entity: (typeof logs)[number]["entity"]) =>
      logs.flatMap((log) =>
        log.entity === entity && log.entityId ? [log.entityId] : [],
      );

    const [books, loans, fines] = await Promise.all([
      ctx.db.book.findMany({
        where: { id: { in: idsOf("book") } },
        select: { id: true, title: true },
      }),
      ctx.db.loan.findMany({
        where: { id: { in: idsOf("loan") } },
        select: { id: true, ...LOAN_NAMES },
      }),
      ctx.db.fine.findMany({
        where: { id: { in: idsOf("fine") } },
        select: { id: true, amount: true, loan: { select: LOAN_NAMES } },
      }),
    ]);

    const byId = <T extends { id: string }>(rows: T[]) =>
      new Map(rows.map((row) => [row.id, row]));
    const bookById = byId(books);
    const loanById = byId(loans);
    const fineById = byId(fines);

    return logs.map((log) => {
      const row = snapshot(log.details);
      const id = log.entityId ?? "";
      const entry = {
        id: log.id,
        kind: "added" as ActivityKind,
        createdAt: log.createdAt,
        staff: log.admin?.email ?? null,
        book: null as string | null,
        member: null as string | null,
        amount: null as string | null,
      };

      if (log.entity === "loan") {
        const loan = loanById.get(id);
        // A loan is only ever updated by its return.
        entry.kind = log.action === "CREATE" ? "checkout" : "return";
        entry.book = loan?.copy.book.title ?? null;
        entry.member = loan ? fullName(loan.member) : null;
      } else if (log.entity === "fine") {
        const fine = fineById.get(id);
        // A fine is only ever updated by marking it paid or unpaid.
        entry.kind =
          log.action === "CREATE"
            ? "fine"
            : row.paidAt != null
              ? "paid"
              : "unpaid";
        entry.book = fine?.loan.copy.book.title ?? null;
        entry.member = fine ? fullName(fine.loan.member) : null;
        entry.amount = fine?.amount.toFixed(2) ?? null;
      } else {
        entry.book = bookById.get(id)?.title ?? text(row.title);
      }

      return entry;
    });
  }),
});

import { Prisma } from "../../../../generated/prisma";

import { daysLate, FINE_PER_DAY } from "~/lib/schemas/loan";
import { startOfMonth, TIME_ZONE } from "~/lib/time";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
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

type FeedKind = "added" | "checkout" | "return" | "fine" | "paid" | "unpaid";

interface FeedItem {
  id: string;
  kind: FeedKind;
  createdAt: Date;
  staff: string | null;
  book: string | null;
  member: string | null;
  amount: string | null;
}

const fullName = (person: { firstName: string; lastName: string }) =>
  `${person.firstName} ${person.lastName}`;

const byId = <T extends { id: string }>(rows: T[]) =>
  new Map(rows.map((row) => [row.id, row]));

const loggedRow = (details: Prisma.JsonValue): Record<string, unknown> => {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return {};
  }
  const { before, after } = details as Record<string, Record<string, unknown>>;
  return { ...before, ...after };
};

export const dashboardRouter = createTRPCRouter({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const soon = new Date(now);
    soon.setDate(soon.getDate() + DUE_SOON_DAYS);

    const [titles, members, copies, borrowed, dueSoon, unpaid] =
      await ctx.db.$transaction(
        [
          ctx.db.book.count(),
          ctx.db.member.count({ where: { status: "ACTIVE" } }),
          ctx.db.bookCopy.count({ where: { withdrawnAt: null } }),
          ctx.db.loan.count({ where: OPEN_LOAN }),
          ctx.db.loan.count({
            where: { ...OPEN_LOAN, dueDate: { gte: now, lt: soon } },
          }),
          ctx.db.fine.aggregate({
            where: { paidAt: null },
            _sum: { amount: true },
            _count: { _all: true },
          }),
        ],
        { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
      );

    return {
      titles,
      members,
      copies,
      borrowed,
      dueSoon,
      dueSoonDays: DUE_SOON_DAYS,
      unpaidFines: (unpaid._sum.amount ?? new Prisma.Decimal(0)).toFixed(2),
      unpaidFinesCount: unpaid._count._all,
    };
  }),

  circulation: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const firstMonth = 1 - CIRCULATION_MONTHS;
    const start = startOfMonth(now, firstMonth);

    const rows = await ctx.db.$queryRaw<
      { month: Date; checkouts: number; returns: number }[]
    >`
      SELECT date_trunc('month', at AT TIME ZONE ${TIME_ZONE}) AT TIME ZONE ${TIME_ZONE} AS month,
        count(*) FILTER (WHERE kind = 'out')::int AS checkouts,
        count(*) FILTER (WHERE kind = 'in')::int AS returns
      FROM (
        SELECT checkout_date AS at, 'out' AS kind FROM loan WHERE checkout_date >= ${start}
        UNION ALL
        SELECT return_date, 'in' FROM loan WHERE return_date >= ${start}
      ) AS events
      GROUP BY 1`;

    const counts = new Map(rows.map((row) => [row.month.getTime(), row]));
    return Array.from({ length: CIRCULATION_MONTHS }, (_, i) => {
      const month = startOfMonth(now, firstMonth + i);
      const row = counts.get(month.getTime());
      return {
        month,
        checkouts: row?.checkouts ?? 0,
        returns: row?.returns ?? 0,
      };
    });
  }),

  popularBooks: protectedProcedure.query(async ({ ctx }) => {
    const counts = await ctx.db.loan.groupBy({
      by: ["bookId"],
      _count: { _all: true },
      orderBy: { _count: { bookId: "desc" } },
      take: POPULAR_LIST_SIZE,
    });
    const books = byId(
      await ctx.db.book.findMany({
        where: { id: { in: counts.map((row) => row.bookId) } },
        include: BOOK_INCLUDE,
      }),
    );

    return counts.flatMap((row) => {
      const book = books.get(row.bookId);
      return book ? [{ ...serializeBook(book), loans: row._count._all }] : [];
    });
  }),

  overdueLoans: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const where = { ...OPEN_LOAN, dueDate: { lt: now } };

    const [total, loans] = await ctx.db.$transaction(
      [
        ctx.db.loan.count({ where }),
        ctx.db.loan.findMany({
          where,
          orderBy: { dueDate: "asc" },
          take: OVERDUE_LIST_SIZE,
          select: { id: true, bookId: true, dueDate: true, ...LOAN_NAMES },
        }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );

    return {
      total,
      loans: loans.map(({ copy, member, ...loan }) => {
        const late = daysLate(loan.dueDate, now);
        return {
          ...loan,
          title: copy.book.title,
          member: fullName(member),
          daysLate: late,
          accruing: (late * FINE_PER_DAY).toFixed(2),
        };
      }),
    };
  }),

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

    const idsOf = (entity: "book" | "loan" | "fine") =>
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
    const bookById = byId(books);
    const loanById = byId(loans);
    const fineById = byId(fines);

    return logs.map((log): FeedItem => {
      const id = log.entityId ?? "";
      const row = loggedRow(log.details);
      const base = {
        id: log.id,
        createdAt: log.createdAt,
        staff: log.admin?.email ?? null,
      };

      if (log.entity === "loan") {
        const loan = loanById.get(id);
        return {
          ...base,
          kind: log.action === "CREATE" ? "checkout" : "return",
          book: loan?.copy.book.title ?? null,
          member: loan ? fullName(loan.member) : null,
          amount: null,
        };
      }

      if (log.entity === "fine") {
        const fine = fineById.get(id);
        const paid = row.paidAt != null ? "paid" : "unpaid";
        return {
          ...base,
          kind: log.action === "CREATE" ? "fine" : paid,
          book: fine?.loan.copy.book.title ?? null,
          member: fine ? fullName(fine.loan.member) : null,
          amount: fine?.amount.toFixed(2) ?? null,
        };
      }

      const title = bookById.get(id)?.title ?? row.title;
      return {
        ...base,
        kind: "added",
        book: typeof title === "string" ? title : null,
        member: null,
        amount: null,
      };
    });
  }),
});

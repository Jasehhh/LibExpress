import { type Prisma } from "../../../../generated/prisma";

import { daysLate, FINE_PER_DAY } from "~/lib/schemas/loan";
import { startOfMonth } from "~/lib/time";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { BOOK_INCLUDE, serializeBook } from "~/server/lib/derived";

const DUE_SOON_DAYS = 7;
const OVERDUE_LIST_SIZE = 6;
const FEED_SIZE = 20;
const CIRCULATION_MONTHS = 6;
const POPULAR_LIST_SIZE = 4;

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

const loggedRow = (details: Prisma.JsonValue): Record<string, unknown> => {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return {};
  }
  const { before, after } = details as Record<string, Record<string, unknown>>;
  return { ...before, ...after };
};

export const dashboardRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const soon = new Date(now);
    soon.setDate(soon.getDate() + DUE_SOON_DAYS);

    const [books, members, loans, logs] = await Promise.all([
      ctx.db.book.findMany({ include: BOOK_INCLUDE }),
      ctx.db.member.findMany({ select: { status: true } }),
      ctx.db.loan.findMany({
        select: {
          id: true,
          bookId: true,
          copyNo: true,
          checkoutDate: true,
          dueDate: true,
          returnDate: true,
          copy: { select: { book: { select: { title: true } } } },
          member: { select: { firstName: true, lastName: true } },
          fine: { select: { id: true, amount: true, paidAt: true } },
        },
      }),
      ctx.db.activityLog.findMany({
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
      }),
    ]);

    const catalog = books.map(serializeBook);
    const openLoans = loans.filter((loan) => !loan.returnDate);
    const lateLoans = openLoans
      .filter((loan) => loan.dueDate < now)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    const fines = loans.flatMap((loan) =>
      loan.fine ? [{ ...loan.fine, loan }] : [],
    );
    const unpaidFines = fines.filter((fine) => !fine.paidAt);

    const overview = {
      titles: catalog.length,
      members: members.filter((member) => member.status === "ACTIVE").length,
      copies: catalog.reduce((sum, book) => sum + book.totalCopies, 0),
      borrowed: openLoans.length,
      dueSoon: openLoans.filter(
        (loan) => loan.dueDate >= now && loan.dueDate < soon,
      ).length,
      dueSoonDays: DUE_SOON_DAYS,
      overdue: lateLoans.length,
      unpaidFines: unpaidFines
        .reduce((sum, fine) => sum + Number(fine.amount), 0)
        .toFixed(2),
      unpaidFinesCount: unpaidFines.length,
    };

    const circulation = Array.from({ length: CIRCULATION_MONTHS }, (_, i) => {
      const month = startOfMonth(now, i + 1 - CIRCULATION_MONTHS);
      const next = startOfMonth(now, i + 2 - CIRCULATION_MONTHS);
      const inMonth = (date: Date | null) =>
        !!date && date >= month && date < next;
      return {
        month,
        checkouts: loans.filter((loan) => inMonth(loan.checkoutDate)).length,
        returns: loans.filter((loan) => inMonth(loan.returnDate)).length,
      };
    });

    const popularBooks = catalog
      .map((book) => ({
        ...book,
        loans: loans.filter((loan) => loan.bookId === book.id).length,
      }))
      .filter((book) => book.loans > 0)
      .sort((a, b) => b.loans - a.loans)
      .slice(0, POPULAR_LIST_SIZE);

    const overdueLoans = lateLoans
      .slice(0, OVERDUE_LIST_SIZE)
      .map(({ id, bookId, copyNo, dueDate, copy, member }) => {
        const late = daysLate(dueDate, now);
        return {
          id,
          bookId,
          copyNo,
          dueDate,
          title: copy.book.title,
          member: fullName(member),
          daysLate: late,
          accruing: (late * FINE_PER_DAY).toFixed(2),
        };
      });

    const activity = logs.map((log): FeedItem => {
      const row = loggedRow(log.details);
      const base = {
        id: log.id,
        createdAt: log.createdAt,
        staff: log.admin?.email ?? null,
      };

      if (log.entity === "loan") {
        const loan = loans.find((loan) => loan.id === log.entityId);
        return {
          ...base,
          kind: log.action === "CREATE" ? "checkout" : "return",
          book: loan?.copy.book.title ?? null,
          member: loan ? fullName(loan.member) : null,
          amount: null,
        };
      }

      if (log.entity === "fine") {
        const fine = fines.find((fine) => fine.id === log.entityId);
        const paid = row.paidAt != null ? "paid" : "unpaid";
        return {
          ...base,
          kind: log.action === "CREATE" ? "fine" : paid,
          book: fine?.loan.copy.book.title ?? null,
          member: fine ? fullName(fine.loan.member) : null,
          amount: fine?.amount.toFixed(2) ?? null,
        };
      }

      const title =
        catalog.find((book) => book.id === log.entityId)?.title ?? row.title;
      return {
        ...base,
        kind: "added",
        book: typeof title === "string" ? title : null,
        member: null,
        amount: null,
      };
    });

    return { overview, circulation, popularBooks, overdueLoans, activity };
  }),
});

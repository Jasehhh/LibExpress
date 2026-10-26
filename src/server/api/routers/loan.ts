import { idInput, memberIdInput } from "~/lib/schemas/common";
import {
  daysLate,
  FINE_PER_DAY,
  LOAN_PERIOD_DAYS,
  loanInput,
  loanReturnInput,
} from "~/lib/schemas/loan";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { diff, logActivity } from "~/server/lib/activityLog";
import { badRequest, lockRow, notFound } from "~/server/lib/db";
import {
  OPEN_LOAN,
  serializeFine,
  unpaidFinesTotal,
  withLoanStatus,
} from "~/server/lib/derived";

const MAX_OPEN_LOANS = 5;
const MAX_UNPAID_FINES = 100;

export const loanRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const loans = await ctx.db.loan.findMany({
      orderBy: { checkoutDate: "desc" },
    });
    return loans.map(withLoanStatus);
  }),

  // Books still out, with the names the return desk searches by and the fine
  // owed if the book came back now.
  getOpen: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const loans = await ctx.db.loan.findMany({
      where: OPEN_LOAN,
      orderBy: { dueDate: "asc" },
      select: {
        id: true,
        bookId: true,
        copyNo: true,
        checkoutDate: true,
        dueDate: true,
        copy: { select: { book: { select: { title: true, isbn: true } } } },
        member: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return loans.map(({ copy, member, ...loan }) => {
      const late = daysLate(loan.dueDate, now);
      return {
        ...loan,
        title: copy.book.title,
        isbn: copy.book.isbn,
        member,
        daysLate: late,
        fineDue: (late * FINE_PER_DAY).toFixed(2),
      };
    });
  }),

  // Every desk transaction, newest first: each loan's checkout and return,
  // and its fine being charged and paid. Built from the loans themselves, so
  // nothing is missed however long ago it happened.
  getTransactions: protectedProcedure.query(async ({ ctx }) => {
    const loans = await ctx.db.loan.findMany({
      select: {
        id: true,
        checkoutDate: true,
        returnDate: true,
        copy: { select: { book: { select: { title: true } } } },
        member: {
          select: { firstName: true, lastName: true, email: true },
        },
        fine: { select: { amount: true, createdAt: true, paidAt: true } },
      },
    });

    type Kind = "checkout" | "return" | "fine" | "paid";
    const events = loans.flatMap(({ id, copy, member, fine, ...loan }) => {
      const base = {
        loanId: id,
        title: copy.book.title,
        member: `${member.firstName} ${member.lastName}`,
        email: member.email,
      };
      const event = (kind: Kind, at: Date, amount: string | null = null) => ({
        ...base,
        id: `${id}-${kind}`,
        kind,
        at,
        amount,
      });
      const amount = fine?.amount.toFixed(2) ?? null;
      return [
        event("checkout", loan.checkoutDate),
        ...(loan.returnDate ? [event("return", loan.returnDate)] : []),
        ...(fine ? [event("fine", fine.createdAt, amount)] : []),
        ...(fine?.paidAt ? [event("paid", fine.paidAt, amount)] : []),
      ];
    });

    return events.sort((a, b) => b.at.getTime() - a.at.getTime());
  }),

  // Every loan a member has had, newest first, with the book's title and
  // any fine it carried.
  getHistory: protectedProcedure
    .input(memberIdInput)
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const loans = await ctx.db.loan.findMany({
        where: { memberId: input.memberId },
        orderBy: { checkoutDate: "desc" },
        select: {
          id: true,
          bookId: true,
          checkoutDate: true,
          dueDate: true,
          returnDate: true,
          copy: { select: { book: { select: { title: true } } } },
          fine: { select: { id: true, amount: true, paidAt: true } },
        },
      });

      return loans.map(({ copy, fine, ...loan }) => ({
        ...withLoanStatus(loan),
        title: copy.book.title,
        daysLate: loan.returnDate ? 0 : daysLate(loan.dueDate, now),
        fine: fine && { ...fine, amount: fine.amount.toFixed(2) },
      }));
    }),

  getById: protectedProcedure.input(idInput).query(async ({ ctx, input }) => {
    const loan = await ctx.db.loan.findUnique({ where: { id: input.id } });
    if (!loan) throw notFound("Loan not found");
    return withLoanStatus(loan);
  }),

  getByMember: protectedProcedure
    .input(memberIdInput)
    .query(async ({ ctx, input }) => {
      const loans = await ctx.db.loan.findMany({
        where: { memberId: input.memberId },
        orderBy: { checkoutDate: "desc" },
      });
      return loans.map(withLoanStatus);
    }),

  create: protectedProcedure.input(loanInput).mutation(({ ctx, input }) =>
    ctx.db.$transaction(async (tx) => {
      const { memberId, bookId } = input;

      if (!(await lockRow(tx, "member", memberId))) {
        throw notFound("Member not found");
      }
      const member = await tx.member.findUniqueOrThrow({
        where: { id: memberId },
        select: { status: true },
      });

      if (member.status === "SUSPENDED") {
        throw badRequest("Suspended members cannot borrow books.");
      }

      const unpaid = await unpaidFinesTotal(tx, memberId);
      if (unpaid.greaterThan(MAX_UNPAID_FINES)) {
        throw badRequest(
          `Members with more than ${MAX_UNPAID_FINES.toFixed(2)} in unpaid fines cannot borrow books.`,
        );
      }

      const openLoans = await tx.loan.count({
        where: { memberId, ...OPEN_LOAN },
      });
      if (openLoans >= MAX_OPEN_LOANS) {
        throw badRequest(`Only ${MAX_OPEN_LOANS} allowable active loans.`);
      }

      if (!(await lockRow(tx, "book", bookId))) {
        throw notFound("Book not found");
      }
      const copy = await tx.bookCopy.findFirst({
        where: { bookId, withdrawnAt: null, loans: { none: OPEN_LOAN } },
        orderBy: { copyNo: "asc" },
        select: { copyNo: true },
      });
      if (!copy) throw badRequest("No available copies of this book.");

      const checkoutDate = new Date();
      const dueDate = new Date(checkoutDate);
      dueDate.setDate(dueDate.getDate() + LOAN_PERIOD_DAYS);

      const loan = await tx.loan.create({
        data: { bookId, copyNo: copy.copyNo, memberId, checkoutDate, dueDate },
      });

      await logActivity(tx, ctx.session, {
        action: "CREATE",
        entity: "loan",
        entityId: loan.id,
        details: { after: loan },
      });

      return withLoanStatus(loan);
    }),
  ),

  return: protectedProcedure.input(loanReturnInput).mutation(({ ctx, input }) =>
    ctx.db.$transaction(async (tx) => {
      const { id, returnDate } = input;
      const notOpen = notFound("Loan not found or already returned");

      if (!(await lockRow(tx, "loan", id))) throw notOpen;
      const before = await tx.loan.findUniqueOrThrow({ where: { id } });
      if (before.returnDate) throw notOpen;

      if (returnDate < before.checkoutDate) {
        throw badRequest("Return date cannot be before checkout date");
      }

      await lockRow(tx, "member", before.memberId);

      const loan = await tx.loan.update({
        where: { id },
        data: { returnDate },
      });

      let fine = null;
      if (returnDate > loan.dueDate) {
        fine = await tx.fine.create({
          data: {
            loanId: loan.id,
            amount: daysLate(loan.dueDate, returnDate) * FINE_PER_DAY,
          },
        });
      }

      const changes = diff(before, loan);
      if (changes) {
        await logActivity(tx, ctx.session, {
          action: "UPDATE",
          entity: "loan",
          entityId: loan.id,
          details: changes,
        });
      }
      if (fine) {
        await logActivity(tx, ctx.session, {
          action: "CREATE",
          entity: "fine",
          entityId: fine.id,
          details: { after: fine },
        });
      }

      return {
        loan: withLoanStatus(loan),
        fine:
          fine && serializeFine({ ...fine, loan: { memberId: loan.memberId } }),
      };
    }),
  ),
});

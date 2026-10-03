import { z } from "zod";

import { idInput } from "~/lib/schemas/common";
import { loanInput, loanReturnInput } from "~/lib/schemas/loan";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { diff, logActivity } from "~/server/lib/activityLog";
import { badRequest, lockRow, notFound } from "~/server/lib/db";
import { serializeFine } from "~/server/lib/money";

const LOAN_PERIOD_DAYS = 14;
const MAX_OPEN_LOANS = 5;
const MAX_UNPAID_FINES = 100;
const FINE_PER_DAY = 20;
const DAY_MS = 1000 * 60 * 60 * 24;

// Overdue loans are still out, so they count as open.
const OPEN_STATUSES = ["ACTIVE", "OVERDUE"] as const;

export const loanRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) =>
    ctx.db.loan.findMany({ orderBy: { checkoutDate: "desc" } }),
  ),

  getById: protectedProcedure.input(idInput).query(async ({ ctx, input }) => {
    const loan = await ctx.db.loan.findUnique({ where: { id: input.id } });
    if (!loan) throw notFound("Loan not found");
    return loan;
  }),

  getByMember: protectedProcedure
    .input(z.object({ memberId: z.string().uuid("Must be a valid id.") }))
    .query(({ ctx, input }) =>
      ctx.db.loan.findMany({
        where: { memberId: input.memberId },
        orderBy: { checkoutDate: "desc" },
      }),
    ),

  // Check a book out to a member.
  create: protectedProcedure.input(loanInput).mutation(({ ctx, input }) =>
    ctx.db.$transaction(async (tx) => {
      const { memberId, bookId } = input;

      if (!(await lockRow(tx, "member", memberId))) {
        throw notFound("Member not found");
      }
      const member = await tx.member.findUniqueOrThrow({
        where: { id: memberId },
        select: { status: true, unpaidFinesTotal: true },
      });

      if (member.status === "SUSPENDED") {
        throw badRequest("Suspended members cannot borrow books.");
      }

      if (member.unpaidFinesTotal.greaterThan(MAX_UNPAID_FINES)) {
        throw badRequest(
          `Members with more than ${MAX_UNPAID_FINES.toFixed(2)} in unpaid fines cannot borrow books.`,
        );
      }

      const openLoans = await tx.loan.count({
        where: { memberId, status: { in: [...OPEN_STATUSES] } },
      });
      if (openLoans >= MAX_OPEN_LOANS) {
        throw badRequest(`Only ${MAX_OPEN_LOANS} allowable active loans.`);
      }

      const taken = await tx.book.updateMany({
        where: { id: bookId, availableCopies: { gt: 0 } },
        data: { availableCopies: { decrement: 1 } },
      });
      if (taken.count === 0) {
        throw badRequest("No available copies of this book.");
      }

      const checkoutDate = new Date();
      const dueDate = new Date(checkoutDate);
      dueDate.setDate(dueDate.getDate() + LOAN_PERIOD_DAYS);

      const loan = await tx.loan.create({
        data: { bookId, memberId, status: "ACTIVE", checkoutDate, dueDate },
      });

      await tx.member.update({
        where: { id: memberId },
        data: { activeLoansCount: { increment: 1 } },
      });

      await logActivity(tx, ctx.session, {
        action: "CREATE",
        entity: "loan",
        entityId: loan.id,
        details: { after: loan },
      });

      return loan;
    }),
  ),

  // Return a book. Late returns get a fine of FINE_PER_DAY per day late.
  return: protectedProcedure
    .input(loanReturnInput)
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction(async (tx) => {
        const { id, returnDate } = input;
        const notOpen = notFound("Loan not found or already returned");

        if (!(await lockRow(tx, "loan", id))) throw notOpen;
        const before = await tx.loan.findUniqueOrThrow({ where: { id } });
        if (before.status === "RETURNED") throw notOpen;

        if (returnDate < before.checkoutDate) {
          throw badRequest("Return date cannot be before checkout date");
        }

        const loan = await tx.loan.update({
          where: { id },
          data: { status: "RETURNED", returnDate },
        });

        await tx.book.update({
          where: { id: loan.bookId },
          data: { availableCopies: { increment: 1 } },
        });
        await tx.member.updateMany({
          where: { id: loan.memberId, activeLoansCount: { gt: 0 } },
          data: { activeLoansCount: { decrement: 1 } },
        });

        let fine = null;
        if (returnDate > loan.dueDate) {
          const daysLate = Math.ceil(
            (returnDate.getTime() - loan.dueDate.getTime()) / DAY_MS,
          );
          const amount = daysLate * FINE_PER_DAY;

          fine = await tx.fine.create({
            data: {
              loanId: loan.id,
              memberId: loan.memberId,
              amount,
              paymentStatus: "UNPAID",
            },
          });
          await tx.member.update({
            where: { id: loan.memberId },
            data: { unpaidFinesTotal: { increment: amount } },
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

        return { loan, fine: fine && serializeFine(fine) };
      }),
    ),
});

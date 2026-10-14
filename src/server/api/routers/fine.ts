import { z } from "zod";

import { idInput } from "~/lib/schemas/common";
import { finePatchInput } from "~/lib/schemas/fine";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { diff, logActivity } from "~/server/lib/activityLog";
import { lockRow, notFound } from "~/server/lib/db";
import { FINE_INCLUDE, serializeFine } from "~/server/lib/money";

export const fineRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const fines = await ctx.db.fine.findMany({
      include: FINE_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return fines.map(serializeFine);
  }),

  getById: protectedProcedure.input(idInput).query(async ({ ctx, input }) => {
    const fine = await ctx.db.fine.findUnique({
      where: { id: input.id },
      include: FINE_INCLUDE,
    });
    if (!fine) throw notFound("Fine not found");
    return serializeFine(fine);
  }),

  getByMember: protectedProcedure
    .input(z.object({ memberId: z.string().uuid("Must be a valid id.") }))
    .query(async ({ ctx, input }) => {
      const fines = await ctx.db.fine.findMany({
        where: { loan: { memberId: input.memberId } },
        include: FINE_INCLUDE,
        orderBy: { createdAt: "desc" },
      });
      return fines.map(serializeFine);
    }),

  // Mark a fine paid or unpaid, which sets or clears paid_at.
  update: protectedProcedure.input(finePatchInput).mutation(({ ctx, input }) =>
    ctx.db.$transaction(async (tx) => {
      const { id, paymentStatus } = input;

      if (!(await lockRow(tx, "fine", id))) throw notFound("Fine not found");
      const before = await tx.fine.findUniqueOrThrow({
        where: { id },
        include: FINE_INCLUDE,
      });

      // What the member owes changes, which checkout reads.
      await lockRow(tx, "member", before.loan.memberId);

      const paidAt =
        paymentStatus === "UNPAID" ? null : (before.paidAt ?? new Date());

      const fine = await tx.fine.update({
        where: { id },
        data: { paidAt },
        include: FINE_INCLUDE,
      });

      const changes = diff(before, fine);
      if (changes) {
        await logActivity(tx, ctx.session, {
          action: "UPDATE",
          entity: "fine",
          entityId: fine.id,
          details: changes,
        });
      }

      return serializeFine(fine);
    }),
  ),
});

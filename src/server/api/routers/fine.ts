import { finePatchInput } from "~/lib/schemas/fine";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { diff, logActivity } from "~/server/lib/activityLog";
import { lockRow, notFound } from "~/server/lib/db";
import { FINE_INCLUDE, serializeFine } from "~/server/lib/derived";

export const fineRouter = createTRPCRouter({
  update: protectedProcedure.input(finePatchInput).mutation(({ ctx, input }) =>
    ctx.db.$transaction(async (tx) => {
      const { id, paymentStatus } = input;

      if (!(await lockRow(tx, "fine", id))) throw notFound("Fine not found");
      const before = await tx.fine.findUniqueOrThrow({
        where: { id },
        include: FINE_INCLUDE,
      });

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

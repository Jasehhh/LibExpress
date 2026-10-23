import { idInput } from "~/lib/schemas/common";
import { memberInput, memberPatchInput } from "~/lib/schemas/member";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { diff, logActivity } from "~/server/lib/activityLog";
import { badRequest, conflict, lockRow, notFound } from "~/server/lib/db";
import { withMemberTotal, withMemberTotals } from "~/server/lib/derived";

export const memberRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const members = await ctx.db.member.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
    return withMemberTotals(ctx.db, members);
  }),

  getById: protectedProcedure.input(idInput).query(async ({ ctx, input }) => {
    const member = await ctx.db.member.findUnique({ where: { id: input.id } });
    if (!member) throw notFound("Member not found");
    return withMemberTotal(ctx.db, member);
  }),

  create: protectedProcedure.input(memberInput).mutation(({ ctx, input }) =>
    ctx.db.$transaction(async (tx) => {
      const existing = await tx.member.findUnique({
        where: { email: input.email },
        select: { id: true },
      });
      if (existing) {
        throw conflict("A member with this email already exists.");
      }

      const member = await tx.member.create({ data: input });

      await logActivity(tx, ctx.session, {
        action: "CREATE",
        entity: "member",
        entityId: member.id,
        details: { after: member },
      });

      return withMemberTotal(tx, member);
    }),
  ),

  update: protectedProcedure
    .input(idInput.extend({ data: memberPatchInput }))
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction(async (tx) => {
        const { id, data } = input;

        if (!(await lockRow(tx, "member", id))) {
          throw notFound("Member not found");
        }
        const before = await tx.member.findUniqueOrThrow({ where: { id } });

        if (data.email !== undefined && data.email !== before.email) {
          const taken = await tx.member.findUnique({
            where: { email: data.email },
            select: { id: true },
          });
          if (taken) throw conflict("A member with this email already exists.");
        }

        const member = await tx.member.update({ where: { id }, data });

        const changes = diff(before, member);
        if (changes) {
          await logActivity(tx, ctx.session, {
            action: "UPDATE",
            entity: "member",
            entityId: member.id,
            details: changes,
          });
        }

        return withMemberTotal(tx, member);
      }),
    ),

  delete: protectedProcedure.input(idInput).mutation(({ ctx, input }) =>
    ctx.db.$transaction(async (tx) => {
      if (!(await lockRow(tx, "member", input.id))) {
        throw notFound("Member not found");
      }
      const member = await tx.member.findUniqueOrThrow({
        where: { id: input.id },
      });

      const loan = await tx.loan.findFirst({
        where: { memberId: input.id },
        orderBy: { returnDate: { sort: "desc", nulls: "first" } },
        select: { returnDate: true },
      });
      if (loan?.returnDate === null) {
        throw badRequest("Cannot delete a member with active loans");
      }
      if (loan) throw conflict("Cannot delete a member that has loan history.");

      await tx.member.delete({ where: { id: input.id } });

      await logActivity(tx, ctx.session, {
        action: "DELETE",
        entity: "member",
        entityId: member.id,
        details: { before: member },
      });

      return withMemberTotal(tx, member);
    }),
  ),
});

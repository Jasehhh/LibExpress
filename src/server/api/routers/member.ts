import { idInput } from "~/lib/schemas/common";
import { memberInput, memberPatchInput } from "~/lib/schemas/member";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { diff, logActivity } from "~/server/lib/activityLog";
import {
  badRequest,
  conflict,
  lockRow,
  notFound,
  onDuplicate,
} from "~/server/lib/db";
import { withMemberTotal, withMemberTotals } from "~/server/lib/derived";

const emailTaken = onDuplicate("A member with this email already exists.");

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
    ctx.db
      .$transaction(async (tx) => {
        const member = await tx.member.create({ data: input });

        await logActivity(tx, ctx.session, {
          action: "CREATE",
          entity: "member",
          entityId: member.id,
          details: { after: member },
        });

        return withMemberTotal(tx, member);
      })
      .catch(emailTaken),
  ),

  update: protectedProcedure
    .input(idInput.extend({ data: memberPatchInput }))
    .mutation(({ ctx, input }) =>
      ctx.db
        .$transaction(async (tx) => {
          const { id, data } = input;

          if (!(await lockRow(tx, "member", id))) {
            throw notFound("Member not found");
          }
          const before = await tx.member.findUniqueOrThrow({ where: { id } });
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
        })
        .catch(emailTaken),
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

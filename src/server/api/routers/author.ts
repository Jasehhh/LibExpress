import { authorInput, authorPatchInput } from "~/lib/schemas/author";
import { idInput } from "~/lib/schemas/common";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { diff, logActivity } from "~/server/lib/activityLog";
import { badRequest, lockRow, notFound } from "~/server/lib/db";

export const authorRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) =>
    ctx.db.author.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ),

  getById: publicProcedure.input(idInput).query(async ({ ctx, input }) => {
    const author = await ctx.db.author.findUnique({ where: { id: input.id } });
    if (!author) throw notFound("Author not found");
    return author;
  }),

  create: protectedProcedure
    .input(authorInput)
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction(async (tx) => {
        const author = await tx.author.create({ data: input });

        await logActivity(tx, ctx.session, {
          action: "CREATE",
          entity: "author",
          entityId: author.id,
          details: { after: author },
        });

        return author;
      }),
    ),

  update: protectedProcedure
    .input(idInput.extend({ data: authorPatchInput }))
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction(async (tx) => {
        if (!(await lockRow(tx, "author", input.id))) {
          throw notFound("Author not found");
        }
        const before = await tx.author.findUniqueOrThrow({
          where: { id: input.id },
        });

        const author = await tx.author.update({
          where: { id: input.id },
          data: input.data,
        });

        const changes = diff(before, author);
        if (changes) {
          await logActivity(tx, ctx.session, {
            action: "UPDATE",
            entity: "author",
            entityId: author.id,
            details: changes,
          });
        }

        return author;
      }),
    ),

  delete: protectedProcedure.input(idInput).mutation(({ ctx, input }) =>
    ctx.db.$transaction(async (tx) => {
      const book = await tx.book.findFirst({
        where: { authorId: input.id },
        select: { id: true },
      });
      if (book) throw badRequest("Cannot delete an author who still has books");

      const author = await tx.author.findUnique({ where: { id: input.id } });
      if (!author) throw notFound("Author not found");

      await tx.author.delete({ where: { id: input.id } });

      await logActivity(tx, ctx.session, {
        action: "DELETE",
        entity: "author",
        entityId: author.id,
        details: { before: author },
      });

      return author;
    }),
  ),
});

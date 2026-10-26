import { authorInput } from "~/lib/schemas/author";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { logActivity } from "~/server/lib/activityLog";

export const authorRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) =>
    ctx.db.author.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ),

  create: protectedProcedure.input(authorInput).mutation(({ ctx, input }) =>
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
});

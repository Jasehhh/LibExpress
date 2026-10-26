import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const authorRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) =>
    ctx.db.author.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ),
});

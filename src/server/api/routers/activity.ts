import { Prisma } from "../../../../generated/prisma";

import { activityQueryInput } from "~/lib/schemas/activity";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const activityRouter = createTRPCRouter({
  // Newest first. The log is only ever written by the other routers.
  list: protectedProcedure
    .input(activityQueryInput)
    .query(async ({ ctx, input }) => {
      const { entity, entityId, adminId, limit, offset } = input;
      const where = { entity, entityId, adminId };

      // One snapshot for both queries so total always matches data.
      const [total, data] = await ctx.db.$transaction(
        [
          ctx.db.activityLog.count({ where }),
          ctx.db.activityLog.findMany({
            where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: limit,
            skip: offset,
          }),
        ],
        { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
      );

      return { data, total };
    }),
});

import { Prisma } from "../../../../generated/prisma";

import { activityQueryInput } from "~/lib/schemas/activity";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const activityRouter = createTRPCRouter({
  list: protectedProcedure
    .input(activityQueryInput)
    .query(async ({ ctx, input }) => {
      const { entity, entityId, adminId, limit, offset } = input;
      const where = { entity, entityId, adminId };

      const [total, rows] = await ctx.db.$transaction(
        [
          ctx.db.activityLog.count({ where }),
          ctx.db.activityLog.findMany({
            where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            include: { admin: { select: { email: true } } },
            take: limit,
            skip: offset,
          }),
        ],
        { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
      );

      const data = rows.map(({ admin, ...row }) => ({
        ...row,
        adminEmail: admin?.email ?? null,
      }));
      return { data, total };
    }),
});

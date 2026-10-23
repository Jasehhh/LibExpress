import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

import { authInput } from "~/lib/schemas/auth";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  hasAccounts: publicProcedure.query(async ({ ctx }) => {
    const admin = await ctx.db.admin.findFirst({ select: { id: true } });
    return admin !== null;
  }),

  register: publicProcedure
    .input(authInput)
    .mutation(async ({ ctx, input }) => {
      const hasAdmin = await ctx.db.admin.findFirst({ select: { id: true } });
      if (hasAdmin && !ctx.session?.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const existing = await ctx.db.admin.findUnique({
        where: { email: input.email },
        select: { id: true },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered.",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 10);

      return ctx.db.admin.create({
        data: { email: input.email, passwordHash },
        select: { id: true, email: true },
      });
    }),
});

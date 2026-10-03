import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

import { authInput } from "~/lib/schemas/auth";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  // Lets the sign-up page know whether the first account still has to be made.
  hasAccounts: publicProcedure.query(async ({ ctx }) => {
    const admin = await ctx.db.admin.findFirst({ select: { id: true } });
    return admin !== null;
  }),

  // Only a signed-in user can add accounts. The very first account needs no
  // session, otherwise nobody could ever sign in. Sign in afterwards with
  // signIn("credentials", { email, password }).
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

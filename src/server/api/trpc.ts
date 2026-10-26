import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth } from "~/server/auth";
import { db } from "~/server/db";

export const createTRPCContext = async (opts: { headers: Headers }) => ({
  db,
  session: await auth(),
  ...opts,
});

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? flattenZodError(error.cause) : null,
      },
    };
  },
});

// Like ZodError.flatten(), except fields nested under an update's `data` are
// keyed by their own name, so a form can show them next to its inputs.
function flattenZodError(error: ZodError) {
  const formErrors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const [field] = issue.path[0] === "data" ? issue.path.slice(1) : issue.path;
    if (field === undefined) formErrors.push(issue.message);
    else (fieldErrors[String(field)] ??= []).push(issue.message);
  }
  return { formErrors, fieldErrors };
}

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({
    ctx: { session: { ...ctx.session, user: ctx.session.user } },
  });
});

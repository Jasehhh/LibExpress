import { activityRouter } from "~/server/api/routers/activity";
import { authorRouter } from "~/server/api/routers/author";
import { authRouter } from "~/server/api/routers/auth";
import { bookRouter } from "~/server/api/routers/book";
import { fineRouter } from "~/server/api/routers/fine";
import { loanRouter } from "~/server/api/routers/loan";
import { memberRouter } from "~/server/api/routers/member";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  activity: activityRouter,
  auth: authRouter,
  author: authorRouter,
  book: bookRouter,
  fine: fineRouter,
  loan: loanRouter,
  member: memberRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.book.getAll();
 *       ^? Book[]
 */
export const createCaller = createCallerFactory(appRouter);

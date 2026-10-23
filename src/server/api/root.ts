import { activityRouter } from "~/server/api/routers/activity";
import { authorRouter } from "~/server/api/routers/author";
import { bookRouter } from "~/server/api/routers/book";
import { fineRouter } from "~/server/api/routers/fine";
import { loanRouter } from "~/server/api/routers/loan";
import { memberRouter } from "~/server/api/routers/member";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  activity: activityRouter,
  author: authorRouter,
  book: bookRouter,
  fine: fineRouter,
  loan: loanRouter,
  member: memberRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

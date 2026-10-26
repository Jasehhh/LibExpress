import { authorRouter } from "~/server/api/routers/author";
import { bookRouter } from "~/server/api/routers/book";
import { dashboardRouter } from "~/server/api/routers/dashboard";
import { fineRouter } from "~/server/api/routers/fine";
import { loanRouter } from "~/server/api/routers/loan";
import { memberRouter } from "~/server/api/routers/member";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  author: authorRouter,
  book: bookRouter,
  dashboard: dashboardRouter,
  fine: fineRouter,
  loan: loanRouter,
  member: memberRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

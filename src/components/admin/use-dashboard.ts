"use client";

import { api } from "~/trpc/react";

const REFRESH_MS = 10_000;

export const useDashboard = () =>
  api.dashboard.get.useSuspenseQuery(undefined, {
    refetchInterval: REFRESH_MS,
  })[0];

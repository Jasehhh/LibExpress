import {
  defaultShouldDehydrateQuery,
  MutationCache,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import SuperJSON from "superjson";

const signInAgain = (err: unknown) => {
  if (
    typeof window !== "undefined" &&
    err instanceof TRPCClientError &&
    (err.data as { code?: string } | undefined)?.code === "UNAUTHORIZED"
  ) {
    window.location.assign("/login");
  }
};

export const createQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({ onError: signInAgain }),
    mutationCache: new MutationCache({ onError: signInAgain }),
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });

"use client";

import { useCallback, useEffect, useState } from "react";

interface QueryState<T> {
  fetcher: (() => Promise<T>) | null;
  data?: T;
  error?: Error;
}

// Runs fetcher (memoize it with useCallback) and keeps the last good data
// on screen while a new fetch or reload is in flight. Pass null to wait,
// for example until the auth token has loaded.
export function useQuery<T>(fetcher: (() => Promise<T>) | null) {
  const [state, setState] = useState<QueryState<T>>({ fetcher: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!fetcher) return;
    let active = true;
    fetcher().then(
      (data) => {
        if (active) setState({ fetcher, data });
      },
      (error: Error) => {
        if (active) setState((prev) => ({ fetcher, data: prev.data, error }));
      },
    );
    return () => {
      active = false;
    };
  }, [fetcher, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const current = fetcher !== null && state.fetcher === fetcher;
  return {
    data: state.data,
    error: current ? state.error : undefined,
    loading: !current,
    reload,
  };
}

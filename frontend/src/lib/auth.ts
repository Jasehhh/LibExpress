"use client";

import { useEffect, useSyncExternalStore } from "react";
import { AdminToken } from "@/lib/types/admin";
import { UNAUTHORIZED_EVENT } from "@/lib/client";

// The JWT from /auth/login lives in localStorage so staff stay signed in
// across tabs and reloads until it expires (the backend issues 1-day tokens).
const STORAGE_KEY = "libexpress.token";

export type SignOutReason = "signed-out" | "expired";

const listeners = new Set<() => void>();
let lastSignOutReason: SignOutReason = "signed-out";

function notify() {
  for (const listener of listeners) listener();
}

export function decodeToken(token: string): AdminToken | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    if (typeof payload.id !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    return payload as AdminToken;
  } catch {
    return null;
  }
}

function readToken(): string | null {
  let token: string | null = null;
  try {
    token = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!token) return null;
  const payload = decodeToken(token);
  if (!payload || payload.exp * 1000 <= Date.now()) return null;
  return token;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function signIn(token: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Private mode without storage: the session lasts until reload.
  }
  notify();
}

export function signOut(reason: SignOutReason = "signed-out") {
  lastSignOutReason = reason;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored.
  }
  notify();
}

export function getSignOutReason() {
  return lastSignOutReason;
}

// token is undefined until the browser has read localStorage, so pages can
// tell "not loaded yet" apart from "signed out".
export function useAuth() {
  const token = useSyncExternalStore<string | null | undefined>(
    subscribe,
    readToken,
    () => undefined,
  );
  const admin = token ? decodeToken(token) : null;
  return { token, admin };
}

// Signs out when the token expires or the backend rejects it.
export function useSessionWatcher(token: string | null | undefined) {
  useEffect(() => {
    if (!token) return;
    const payload = decodeToken(token);
    if (!payload) return;
    const timer = window.setTimeout(
      () => signOut("expired"),
      Math.max(payload.exp * 1000 - Date.now(), 0),
    );
    return () => window.clearTimeout(timer);
  }, [token]);

  useEffect(() => {
    const onUnauthorized = () => signOut("expired");
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);
}

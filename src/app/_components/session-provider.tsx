"use client";

import { SessionProvider } from "next-auth/react";

// Gives client components useSession(), signIn() and signOut(). Replaces the
// old AuthContext that kept a token in localStorage.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

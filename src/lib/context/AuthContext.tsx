"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useReducer } from "react";

import { type AuthAdmin } from "~/lib/types";

// NextAuth keeps the session in a cookie, so there is no token to store.
// This reducer mirrors the session for components that read useAuth(), and
// keeps loading and error state for the sign-in form.
interface AuthState {
  admin: AuthAdmin | null;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: "SET_AUTH" }
  | { type: "AUTH_SUCCESS"; payload: { admin: AuthAdmin } }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "SET_ERROR"; payload: string | null };

const initialAuthState: AuthState = {
  admin: null,
  loading: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_AUTH":
      return { ...state, loading: true, error: null };
    case "AUTH_SUCCESS":
      return { admin: action.payload.admin, loading: false, error: null };
    case "AUTH_FAILURE":
      return { ...initialAuthState, error: action.payload };
    case "LOGOUT":
      return initialAuthState;
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

interface AuthContextValue {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const { data: session, status } = useSession();

  // Follow the NextAuth session: signIn() and signOut() update it.
  useEffect(() => {
    if (status === "loading") {
      dispatch({ type: "SET_AUTH" });
    } else if (session?.user?.email) {
      dispatch({
        type: "AUTH_SUCCESS",
        payload: { admin: { id: session.user.id, email: session.user.email } },
      });
    } else {
      dispatch({ type: "LOGOUT" });
    }
  }, [session, status]);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthStateProvider>{children}</AuthStateProvider>
    </SessionProvider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

"use client";

import { createContext, useContext, useEffect, useReducer } from "react";
import { AuthAdmin } from "../types/admin";
interface AuthState {
  token: string | null;
  admin: AuthAdmin | null;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: "SET_AUTH" }
  | { type: "AUTH_SUCCESS"; payload: {token: string; admin: AuthAdmin} }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "SET_ERROR"; payload: string | null };

const initialAuthState: AuthState = 
{ 
    token: null, 
    loading: false, 
    admin: null,
    error: null 
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_AUTH":
      return { ...state, loading: true, error: null };
    case "AUTH_SUCCESS":
      return { token: action.payload.token, admin: action.payload.admin, loading: false, error: null };
    case "AUTH_FAILURE":
      return {...initialAuthState, error: action.payload };
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  
  useEffect(() => {
    const token = localStorage.getItem("token");
    const admin = localStorage.getItem("admin");
    if (token && admin) {
      dispatch({
        type: "AUTH_SUCCESS",
        payload: { token, admin: JSON.parse(admin) },
      });
    }
  }, []);

 
  useEffect(() => {
    if (state.token && state.admin) {
      localStorage.setItem("token", state.token);
      localStorage.setItem("admin", JSON.stringify(state.admin));
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("admin");
    }
  }, [state.token, state.admin]);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
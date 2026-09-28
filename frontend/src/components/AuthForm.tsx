"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { login, register } from "@/app/api/authService";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/Button";
import { FormError, TextField } from "@/components/ui/Field";
import { signIn, useAuth } from "@/lib/auth";
import { ApiError, errorMessage } from "@/lib/client";
import { authBodySchema } from "@/lib/schemas/auth";
import { validate } from "@/lib/schemas/validate";

// Only send people back to pages inside the staff area.
function safeNext(next: string | null) {
  return next && next.startsWith("/admin") ? next : "/admin";
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const { token } = useAuth();
  const next = safeNext(params.get("next"));
  const expired = params.get("expired") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in (or just signed in): go to the staff desk.
  useEffect(() => {
    if (token) router.replace(next);
  }, [token, next, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const checked = validate(authBodySchema, { email: email.trim(), password });
    const found: Record<string, string> = { ...checked.errors };
    if (mode === "register" && !found.password && password !== confirm) {
      found.confirm = "The passwords don't match.";
    }
    setErrors(found);
    if (!checked.data || Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      const { token: issued } =
        mode === "login"
          ? await login(checked.data.email, checked.data.password)
          : await register(checked.data.email, checked.data.password);
      signIn(issued);
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.status === 401 ? "That email and password don't match a staff account." : errorMessage(err),
      );
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setBusy(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <Brand />
        </div>
        <div className="catalog-card catalog-card-plain px-6 pb-8 sm:px-8">
          <div className="flex h-14 items-center text-[0.9375rem] font-semibold text-ink-soft">Staff only</div>
          <h1 className="pt-7 pb-3 font-serif text-[1.75rem] font-semibold leading-tight">
            {isLogin ? "Sign in to the staff desk" : "Create a staff account"}
          </h1>
          {expired && isLogin && (
            <p role="status" className="mb-4 rounded-md border border-caution/30 bg-caution-wash px-3 py-2 text-sm text-caution">
              Your session ended. Sign in again to continue.
            </p>
          )}
          <form onSubmit={submit} noValidate className="flex flex-col gap-4 pt-3">
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
              autoFocus
              required
            />
            <TextField
              label="Password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={errors.password}
              hint={isLogin ? undefined : "At least 6 characters."}
              required
            />
            {!isLogin && (
              <TextField
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                error={errors.confirm}
                required
              />
            )}
            <FormError message={formError} />
            <Button type="submit" busy={busy} className="mt-2 w-full">
              {isLogin ? "Sign in" : "Create account"}
            </Button>
          </form>
        </div>
        <div className="mt-6 flex flex-col gap-2 text-sm text-ink-soft">
          {isLogin ? (
            <p>
              New to the team?{" "}
              <Link href="/register" className="font-semibold text-stamp hover:underline">
                Create a staff account
              </Link>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-stamp hover:underline">
                Sign in
              </Link>
            </p>
          )}
          <p>
            Looking for a book?{" "}
            <Link href="/" className="font-semibold text-stamp hover:underline">
              Browse the catalogue
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

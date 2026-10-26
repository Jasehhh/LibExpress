"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setPending(true);

    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    setPending(false);
    if (!result || result.error) {
      setError("Wrong email or password.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        icon={<UserIcon />}
      />
      <Field
        label="Password"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        icon={<LockIcon />}
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-1 flex size-8 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          >
            <EyeIcon crossed={showPassword} />
          </button>
        }
      />

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm text-white/80 underline-offset-4 hover:text-white hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {error && (
        <p
          role="alert"
          className="bg-danger-light text-danger rounded-md px-3 py-2 text-sm"
        >
          {error}
        </p>
      )}

      <div className="flex justify-center pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-info rounded-md px-12 py-2 font-semibold tracking-wide text-white shadow-[0_4px_0_rgba(0,0,0,0.25)] transition hover:brightness-110 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
        >
          {pending ? "SIGNING IN…" : "LOGIN"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  icon,
  trailing,
  ...input
}: {
  label: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block pl-3 text-sm text-white/90">{label}</span>
      <span className="relative flex items-center">
        <span className="border-info bg-navy absolute left-0 flex size-10 items-center justify-center rounded-full border-2 text-white">
          {icon}
        </span>
        <input
          required
          {...input}
          className={`bg-info h-10 w-full rounded-full pl-12 text-white outline-none placeholder:text-white/50 focus:ring-2 focus:ring-white/60 ${
            trailing ? "pr-11" : "pr-4"
          }`}
        />
        {trailing}
      </span>
    </label>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path d="m4 4 16 16" />}
    </svg>
  );
}

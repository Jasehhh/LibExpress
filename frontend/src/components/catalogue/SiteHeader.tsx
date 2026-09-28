"use client";

import Link from "next/link";
import { Brand } from "@/components/Brand";
import { buttonClass } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";

export function SiteHeader() {
  const { token } = useAuth();
  return (
    <header className="border-b border-rule bg-surface">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-8">
        <Brand />
        {token ? (
          <Link href="/admin" className={buttonClass("secondary", "sm")}>
            Open staff desk
          </Link>
        ) : (
          <Link href="/login" className="text-sm font-semibold text-ink-soft hover:text-ink hover:underline">
            Staff sign in
          </Link>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-rule">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-ink-soft sm:flex-row sm:justify-between sm:px-8">
        <p>LibExpress library catalogue</p>
        <p>To borrow a book, bring it to the circulation desk.</p>
      </div>
    </footer>
  );
}

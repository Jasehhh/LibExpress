"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Brand } from "@/components/Brand";
import { getSignOutReason, signOut, useAuth, useSessionWatcher } from "@/lib/auth";
import { AdminToken } from "@/lib/types/admin";
import {
  ActivityIcon,
  AuthorsIcon,
  BooksIcon,
  CloseIcon,
  FinesIcon,
  LoansIcon,
  MembersIcon,
  MenuIcon,
  OverviewIcon,
} from "./icons";

interface Staff {
  token: string;
  admin: AdminToken | null;
}

const StaffContext = createContext<Staff | null>(null);

// Token and signed-in admin for pages inside the staff area.
export function useStaff(): Staff {
  const staff = useContext(StaffContext);
  if (!staff) throw new Error("useStaff must be used inside StaffShell");
  return staff;
}

const NAV = [
  { href: "/admin", label: "Overview", icon: OverviewIcon },
  { href: "/admin/loans", label: "Loans", icon: LoansIcon },
  { href: "/admin/books", label: "Books", icon: BooksIcon },
  { href: "/admin/authors", label: "Authors", icon: AuthorsIcon },
  { href: "/admin/members", label: "Members", icon: MembersIcon },
  { href: "/admin/fines", label: "Fines", icon: FinesIcon },
  { href: "/admin/activity", label: "Activity log", icon: ActivityIcon },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export function StaffShell({ children }: { children: ReactNode }) {
  const { token, admin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  useSessionWatcher(token);

  useEffect(() => {
    if (token !== null) return;
    const params = new URLSearchParams({ next: pathname });
    if (getSignOutReason() === "expired") params.set("expired", "1");
    router.replace(`/login?${params}`);
  }, [token, pathname, router]);

  if (!token) {
    return (
      <div role="status" className="flex flex-1 items-center justify-center text-ink-soft">
        Opening the staff desk…
      </div>
    );
  }

  const nav = (
    <nav aria-label="Staff" className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: NavIcon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMenuOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-10 items-center gap-3 rounded-md px-3 text-[0.9375rem] font-semibold transition-colors ${
              active ? "bg-stamp-wash text-stamp-deep" : "text-ink-soft hover:bg-paper hover:text-ink"
            }`}
          >
            {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-stamp" aria-hidden />}
            <NavIcon />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const account = (
    <div className="flex flex-col gap-3 border-t border-rule pt-4">
      <div className="min-w-0">
        <p className="text-xs text-ink-soft">Signed in as</p>
        <p className="truncate text-sm font-semibold" title={admin?.email}>
          {admin?.email ?? "Staff"}
        </p>
      </div>
      <div className="flex gap-3 text-sm">
        <Link href="/" className="font-semibold text-stamp hover:underline">
          Public catalogue
        </Link>
        <button
          type="button"
          onClick={() => signOut()}
          className="font-semibold text-ink-soft hover:text-ink hover:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <StaffContext.Provider value={{ token, admin }}>
      <div className="flex min-h-dvh flex-1">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-8 border-r border-rule bg-surface px-4 py-6 lg:flex">
          <div className="px-2">
            <Brand href="/admin" subtitle="Staff desk" />
          </div>
          <div className="flex-1 overflow-y-auto">{nav}</div>
          {account}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-rule bg-surface/95 px-4 backdrop-blur lg:hidden">
            <Brand href="/admin" />
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="staff-menu"
              className="flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-ink-soft hover:bg-paper"
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
              Menu
            </button>
          </div>
          {menuOpen && (
            <div
              id="staff-menu"
              className="fixed inset-x-0 top-14 bottom-0 z-20 flex flex-col gap-6 overflow-y-auto border-t border-rule bg-surface px-4 py-4 lg:hidden"
            >
              {nav}
              {account}
            </div>
          )}

          <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 lg:py-12">
            {children}
          </main>
        </div>
      </div>
    </StaffContext.Provider>
  );
}

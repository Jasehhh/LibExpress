"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: <GridIcon /> },
  { href: "/dashboard/catalog", label: "Catalog", icon: <ShelfIcon /> },
  { href: "/dashboard/members", label: "Members", icon: <PeopleIcon /> },
  {
    href: "/dashboard/transactions",
    label: "Transactions",
    icon: <SwapIcon />,
  },
];

// The dashboard link owns only its own page; other links also own the pages
// below them (a catalog link stays lit on /dashboard/catalog/...).
const isActive = (pathname: string, href: string) =>
  href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

export function Sidebar({
  signOutAction,
}: {
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <aside className="text-on-navy flex shrink-0 items-center gap-4 px-4 py-3 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:flex-col lg:items-stretch lg:gap-0 lg:px-6 lg:py-8">
      <Link
        href="/dashboard"
        className="flex items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
      >
        {/* brightness-0 + invert turns the navy logo into a white one. */}
        <Image
          src="/logo.svg"
          alt=""
          width={845}
          height={728}
          unoptimized
          className="h-auto w-10 shrink-0 brightness-0 invert"
        />
        <span className="hidden leading-tight sm:block">
          <span className="block text-lg font-bold tracking-tight">
            LibExpress
          </span>
          <span className="text-on-navy-muted block text-sm">Front desk</span>
        </span>
      </Link>

      <div
        aria-hidden
        className="hidden h-px bg-white/10 lg:mt-8 lg:mb-8 lg:block"
      />

      <nav aria-label="Staff" className="flex gap-1 lg:flex-col lg:gap-2">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none lg:px-4 ${
                active
                  ? "text-navy bg-white shadow-[0_6px_16px_-6px_rgba(0,0,0,0.4)]"
                  : "text-on-navy-muted hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <form action={signOutAction} className="ml-auto lg:mt-auto lg:ml-0">
        <button
          type="submit"
          aria-label="Sign out"
          className="hover:text-navy flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none lg:py-3"
        >
          <span className="hidden sm:inline">Sign out</span>
          <SignOutIcon />
        </button>
      </form>
    </aside>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function GridIcon() {
  return (
    <Icon>
      <rect x="4" y="4" width="7" height="9" rx="1.5" />
      <rect x="13" y="4" width="7" height="5" rx="1.5" />
      <rect x="13" y="11" width="7" height="9" rx="1.5" />
      <rect x="4" y="15" width="7" height="5" rx="1.5" />
    </Icon>
  );
}

function ShelfIcon() {
  return (
    <Icon>
      <path d="M5 4v14M9 4v14M13.5 5.5l3.5 12.5M3 20h18" />
    </Icon>
  );
}

function PeopleIcon() {
  return (
    <Icon>
      <circle cx="9" cy="9" r="3.5" />
      <path d="M3 19a6 6 0 0 1 12 0M16 5.5a3.5 3.5 0 0 1 0 7M18 13.5a6 6 0 0 1 3 5.5" />
    </Icon>
  );
}

function SwapIcon() {
  return (
    <Icon>
      <path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5" />
    </Icon>
  );
}

function SignOutIcon() {
  return (
    <Icon>
      <path d="M14 5h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h9" />
    </Icon>
  );
}

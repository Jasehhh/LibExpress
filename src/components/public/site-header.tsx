import Image from "next/image";
import Link from "next/link";

export function SiteHeader({
  query,
  signedIn,
}: {
  query: string;
  signedIn: boolean;
}) {
  return (
    <header className="border-border bg-surface/90 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:gap-8 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/logo.svg"
            alt=""
            width={32}
            height={32}
            unoptimized
            className="size-8"
          />
          <span className="text-navy hidden text-lg font-bold tracking-tight sm:inline">
            LibExpress
          </span>
        </Link>

        <form action="/" role="search" className="relative w-full max-w-md">
          <label htmlFor="catalog-search" className="sr-only">
            Search the catalog
          </label>
          <SearchIcon />
          <input
            id="catalog-search"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by title, author or ISBN"
            className="border-border bg-background placeholder:text-muted focus:border-primary-light focus:ring-primary-light/30 h-10 w-full rounded-full border pr-4 pl-10 text-sm outline-none focus:ring-2"
          />
        </form>

        {signedIn ? (
          <Link
            href="/api/auth/signout"
            className="text-navy border-border hover:bg-surface-muted focus-visible:ring-primary-light ml-auto shrink-0 rounded-md border px-4 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            Sign out
          </Link>
        ) : (
          <Link
            href="/login"
            className="bg-navy hover:bg-info focus-visible:ring-primary-light ml-auto flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_0_rgba(0,0,0,0.25)] transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <LockIcon />
            <span>
              Staff<span className="hidden sm:inline"> sign in</span>
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="text-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

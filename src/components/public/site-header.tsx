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

        <Link
          href={signedIn ? "/api/auth/signout" : "/login"}
          className="text-navy hover:bg-surface-muted focus-visible:ring-primary-light ml-auto shrink-0 rounded-full px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
        >
          {signedIn ? "Sign out" : "Staff sign in"}
        </Link>
      </div>
    </header>
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

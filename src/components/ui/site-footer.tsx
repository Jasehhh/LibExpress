import Image from "next/image";
import Link from "next/link";

const LINK_GROUPS = [
  {
    title: "Browse",
    links: [
      { label: "New arrivals", href: "/#catalog" },
      { label: "Search the catalog", href: "/#catalog-search" },
    ],
  },
  {
    title: "Staff",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-border bg-surface border-t">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-[2fr_1fr_1fr] sm:px-6">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt=""
              width={32}
              height={32}
              unoptimized
              className="size-8"
            />
            <span className="text-navy text-lg font-bold tracking-tight">
              LibExpress
            </span>
          </Link>
          <p className="text-muted mt-3 max-w-xs text-sm">
            Find a book, see if it is on the shelf, and borrow it at the desk.
          </p>
        </div>

        {LINK_GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="text-navy text-sm font-semibold">{group.title}</h2>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <p className="border-border text-muted border-t px-4 py-6 text-center text-xs">
        © {new Date().getFullYear()} LibExpress
      </p>
    </footer>
  );
}

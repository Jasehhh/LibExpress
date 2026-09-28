import Link from "next/link";

// Wordmark: three book spines on a shelf, then the name.
export function Brand({ href = "/", subtitle }: { href?: string; subtitle?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5 rounded-sm">
      <svg viewBox="0 0 28 24" className="h-6 w-7 shrink-0" aria-hidden>
        <rect x="2" y="5" width="5" height="16" rx="0.75" fill="#4636b0" />
        <rect x="8.5" y="2" width="5" height="19" rx="0.75" fill="#1c2230" />
        <rect x="15.5" y="6.5" width="5" height="14.5" rx="0.75" fill="#2b6a4a" transform="rotate(-12 18 21)" />
        <rect x="1" y="21" width="26" height="1.5" rx="0.75" fill="#1c2230" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-serif text-[1.3rem] font-semibold tracking-[-0.01em] text-ink">LibExpress</span>
        {subtitle && <span className="mt-1 text-xs text-ink-soft">{subtitle}</span>}
      </span>
    </Link>
  );
}

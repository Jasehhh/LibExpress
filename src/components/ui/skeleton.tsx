// A gray pulsing box that stands in for content while it loads.
// Pass a className to give it a size and shape, e.g. "h-4 w-32".
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`bg-surface-muted animate-pulse rounded-md ${className}`}
    />
  );
}

// Placeholder for the admin pages that show a title and a table.
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="border-border bg-surface rounded-2xl border p-4">
      <Skeleton className="mb-4 h-9 w-64" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="mb-3 h-10 w-full last:mb-0" />
      ))}
    </div>
  );
}

// Placeholder for an admin page: title on top, anything below.
export function AdminPageSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <main
      aria-busy
      aria-label="Loading"
      className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8"
    >
      <Skeleton className="h-10 w-48" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="mt-8 grid gap-6">{children}</div>
    </main>
  );
}

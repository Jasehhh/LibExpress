import { Skeleton } from "~/components/ui/skeleton";

// Shown while the home page loads its books.
export default function HomeLoading() {
  return (
    <>
      {/* Header bar */}
      <div className="border-border bg-surface border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-full max-w-md rounded-full" />
          <Skeleton className="ml-auto h-9 w-28" />
        </div>
      </div>

      <main
        aria-busy
        aria-label="Loading"
        className="mx-auto max-w-7xl px-4 pt-6 pb-20 sm:px-6"
      >
        {/* Hero banner */}
        <Skeleton className="h-72 w-full rounded-3xl" />

        {/* Section title */}
        <Skeleton className="mt-14 h-9 w-56" />
        <Skeleton className="mt-2 h-4 w-32" />

        {/* Book cards */}
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[2/3] w-full" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-2/3" />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

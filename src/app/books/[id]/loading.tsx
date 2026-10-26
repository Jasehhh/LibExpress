import { Skeleton } from "~/components/ui/skeleton";

// Shown while a book's page loads.
export default function BookLoading() {
  return (
    <main
      aria-busy
      aria-label="Loading"
      className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[18rem_1fr]"
    >
      {/* Cover */}
      <Skeleton className="aspect-[2/3] w-full max-w-72" />

      {/* Title, author and description */}
      <div>
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="mt-3 h-5 w-1/3" />
        <Skeleton className="mt-8 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <Skeleton className="mt-8 h-11 w-40" />
      </div>
    </main>
  );
}

import { AdminPageSkeleton, Skeleton } from "~/components/ui/skeleton";

// Shown while the dashboard overview loads.
export default function DashboardLoading() {
  return (
    <AdminPageSkeleton>
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl sm:h-32" />
        ))}
      </div>

      {/* Chart + activity feed */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>

      {/* Popular books + overdue loans */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </AdminPageSkeleton>
  );
}

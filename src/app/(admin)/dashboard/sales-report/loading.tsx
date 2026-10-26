import {
  AdminPageSkeleton,
  Skeleton,
  TableSkeleton,
} from "~/components/ui/skeleton";

export default function SalesReportLoading() {
  return (
    <AdminPageSkeleton>
      {/* Period totals band */}
      <Skeleton className="h-44 rounded-2xl" />
      <TableSkeleton />
    </AdminPageSkeleton>
  );
}

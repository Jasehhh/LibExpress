import {
  AdminPageSkeleton,
  Skeleton,
  TableSkeleton,
} from "~/components/ui/skeleton";

export default function TransactionsLoading() {
  return (
    <AdminPageSkeleton>
      {/* Check out + return forms */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
      <TableSkeleton rows={5} />
    </AdminPageSkeleton>
  );
}

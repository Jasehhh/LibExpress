import { AdminPageSkeleton, TableSkeleton } from "~/components/ui/skeleton";

export default function CatalogLoading() {
  return (
    <AdminPageSkeleton>
      <TableSkeleton />
    </AdminPageSkeleton>
  );
}

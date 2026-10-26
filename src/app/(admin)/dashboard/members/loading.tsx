import { AdminPageSkeleton, TableSkeleton } from "~/components/ui/skeleton";

export default function MembersLoading() {
  return (
    <AdminPageSkeleton>
      <TableSkeleton />
    </AdminPageSkeleton>
  );
}

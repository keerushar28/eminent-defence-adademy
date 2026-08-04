import TableSkeleton from "@/features/admin/inventory/components/shared/TableSkeleton";
import { Skeleton } from "@/features/core/components/skeleton";

export default function OrdersLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <Skeleton className="h-9 w-[150px] mb-2" />
        <Skeleton className="h-5 w-[350px]" />
      </div>

      <TableSkeleton rows={5} columns={8} />
    </div>
  );
}

import TableSkeleton from "@/features/admin/inventory/components/shared/TableSkeleton";
import { Skeleton } from "@/features/core/components/skeleton";

export default function VendorsLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <Skeleton className="h-9 w-[200px] mb-2" />
        <Skeleton className="h-5 w-[300px]" />
      </div>

      <TableSkeleton rows={5} columns={7} />
    </div>
  );
}

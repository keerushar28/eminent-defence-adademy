import TableSkeleton from "@/features/admin/inventory/components/shared/TableSkeleton";
import { Skeleton } from "@/features/core/components/skeleton";

export default function ItemsLoading() {
  return (
    <div className="p-6 flex flex-col gap-4">
      <div>
        <Skeleton className="h-9 w-[250px] mb-2" />
        <Skeleton className="h-5 w-[350px]" />
      </div>

      <TableSkeleton rows={5} columns={9} />
    </div>
  );
}

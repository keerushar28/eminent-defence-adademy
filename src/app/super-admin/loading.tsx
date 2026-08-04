import { Skeleton } from "@/features/core/components/skeleton";

export default function Loading() {
    return (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full bg-muted/50" />
            ))}
        </div>
    );
}
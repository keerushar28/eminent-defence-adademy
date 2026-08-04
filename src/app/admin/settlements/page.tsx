export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { SettlementsPageClient } from "@/features/admin/settlements/components/settlements-page-client";
import { 
  getSettlementStats, 
  getAllPaymentsPaginated
} from "@/features/admin/settlements/actions/settlement-actions";
import { Skeleton } from "@/features/core/components/skeleton";
import { Card, CardContent, CardHeader } from "@/features/core/components/card";

function SettlementsLoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-20" />
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function SettlementsContent() {
  // Fetch initial data in parallel
  const [stats, paymentsResult] = await Promise.all([
    getSettlementStats(),
    getAllPaymentsPaginated({ page: 1, pageSize: 10 }),
  ]);

  return (
    <SettlementsPageClient
      initialStats={stats}
      initialPayments={paymentsResult.payments}
      initialPaymentsPagination={{
        totalCount: paymentsResult.totalCount,
        totalPages: paymentsResult.totalPages,
        currentPage: paymentsResult.currentPage,
        pageSize: paymentsResult.pageSize,
      }}
    />
  );
}

export default function SettlementsPage() {
  return (
    <Suspense fallback={<SettlementsLoadingSkeleton />}>
      <SettlementsContent />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { SettlementStatsCards } from "./settlement-stats-cards";
import { PaymentsDataTable } from "./payments-data-table";
import { getAllPaymentsPaginated } from "../actions/settlement-actions";
import type { 
  SettlementStats, 
  PaymentWithDetails, 
  GetPaymentsParams
} from "../types";

interface SettlementsPageClientProps {
  initialStats: SettlementStats;
  initialPayments: PaymentWithDetails[];
  initialPaymentsPagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export function SettlementsPageClient({
  initialStats,
  initialPayments,
  initialPaymentsPagination,
}: SettlementsPageClientProps) {
  const [stats, setStats] = useState(initialStats);
  const [payments, setPayments] = useState(initialPayments);
  const [paymentsPagination, setPaymentsPagination] = useState(initialPaymentsPagination);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  const handlePaymentsParamsChange = async (params: GetPaymentsParams) => {
    setIsLoadingPayments(true);
    try {
      const result = await getAllPaymentsPaginated(params);
      setPayments(result.payments);
      setPaymentsPagination({
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        pageSize: result.pageSize,
      });
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve payments across categories, hostel, and inventory
        </p>
      </div>

      {/* Stats Cards */}
      <SettlementStatsCards stats={stats} />

      {/* Payment Management */}
      <PaymentsDataTable
        initialPayments={payments}
        totalCount={paymentsPagination.totalCount}
        totalPages={paymentsPagination.totalPages}
        currentPage={paymentsPagination.currentPage}
        pageSize={paymentsPagination.pageSize}
        onParamsChange={handlePaymentsParamsChange}
        isLoading={isLoadingPayments}
      />
    </div>
  );
}
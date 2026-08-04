"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { 
  getAllPaymentsPaginated, 
  getSettlements, 
  getSettlementStats,
  createSettlement 
} from "../actions/settlement-actions";
import type { 
  PaymentWithDetails, 
  Settlement, 
  SettlementStats, 
  GetPaymentsParams,
  CreateSettlementParams 
} from "../types";

export function useSettlements() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<SettlementStats | null>(null);
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const newStats = await getSettlementStats();
      setStats(newStats);
      return newStats;
    } catch (error) {
      toast.error("Failed to fetch settlement statistics");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPayments = useCallback(async (params: GetPaymentsParams = {}) => {
    try {
      setIsLoading(true);
      const result = await getAllPaymentsPaginated(params);
      setPayments(result.payments);
      return result;
    } catch (error) {
      toast.error("Failed to fetch payments");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSettlements = useCallback(async (page = 1, pageSize = 10) => {
    try {
      setIsLoading(true);
      const result = await getSettlements(page, pageSize);
      setSettlements(result.settlements);
      return result;
    } catch (error) {
      toast.error("Failed to fetch settlements");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewSettlement = useCallback(async (params: CreateSettlementParams) => {
    try {
      setIsLoading(true);
      const result = await createSettlement(params);
      
      if (result.success) {
        toast.success(`Settlement created successfully for ${params.paymentIds.length} payments`);
        // Refresh data
        await Promise.all([
          fetchStats(),
          fetchPayments(),
          fetchSettlements(),
        ]);
        return result;
      } else {
        toast.error(result.error || "Failed to create settlement");
        return result;
      }
    } catch (error) {
      toast.error("An error occurred while creating settlement");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchStats, fetchPayments, fetchSettlements]);

  return {
    isLoading,
    stats,
    payments,
    settlements,
    fetchStats,
    fetchPayments,
    fetchSettlements,
    createNewSettlement,
  };
}
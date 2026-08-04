"use client";

import { useState, useEffect } from "react";
import { ExpenseReportData, UsageReportData, DashboardStats } from "../types/inventory-types";
import { generateExpenseReport, generateUsageReport, getDashboardStats } from "../actions/report-actions";

/**
 * Hook to generate and fetch expense report
 */
export function useExpenseReport(
  dateFrom: Date | null,
  dateTo: Date | null,
  categoryId?: string
) {
  const [report, setReport] = useState<ExpenseReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dateFrom || !dateTo) {
      setReport(null);
      setLoading(false);
      return;
    }

    const capturedDateFrom = dateFrom; // Capture the non-null dates
    const capturedDateTo = dateTo;
    const capturedCategoryId = categoryId;

    async function fetchReport() {
      try {
        setLoading(true);
        setError(null);
        const data = await generateExpenseReport(capturedDateFrom, capturedDateTo, capturedCategoryId);
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate expense report");
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [dateFrom, dateTo, categoryId]);

  return { report, loading, error };
}

/**
 * Hook to generate and fetch usage report
 */
export function useUsageReport(
  dateFrom: Date | null,
  dateTo: Date | null,
  categoryId?: string
) {
  const [report, setReport] = useState<UsageReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dateFrom || !dateTo) {
      setReport(null);
      setLoading(false);
      return;
    }

    const capturedDateFrom = dateFrom; // Capture the non-null dates
    const capturedDateTo = dateTo;
    const capturedCategoryId = categoryId;

    async function fetchReport() {
      try {
        setLoading(true);
        setError(null);
        const data = await generateUsageReport(capturedDateFrom, capturedDateTo, capturedCategoryId);
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate usage report");
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [dateFrom, dateTo, categoryId]);

  return { report, loading, error };
}

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch dashboard statistics");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}

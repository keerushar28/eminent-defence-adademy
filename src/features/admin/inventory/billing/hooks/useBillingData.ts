import { useState, useEffect, useCallback, useRef } from "react";
import { getBills } from "../../actions/billing-actions";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useBillingData(excludeCategoryNames?: string[]) {
  const [bills, setBills] = useState<Record<string, unknown>[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [dateFilterType, setDateFilterType] = useState<"period" | "billDate">("period");

  // Use a ref for dateRange to avoid it being a useCallback dependency (object identity issue)
  const dateRangeRef = useRef(dateRange);
  dateRangeRef.current = dateRange;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch bills — pagination values are passed as params to avoid stale closure issues
  const fetchBills = useCallback(async (page?: number, limit?: number) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getBills({
        categoryId: selectedCategory === "all" ? undefined : selectedCategory,
        dateFrom: dateRangeRef.current.from?.toISOString(),
        dateTo: dateRangeRef.current.to?.toISOString(),
        search: debouncedSearch,
        page: page ?? pagination.page,
        limit: limit ?? pagination.limit,
        dateFilterType,
        excludeCategoryNames,
      });

      setBills(data.bills || []);
      setPagination({
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 20,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching bills:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, dateFilterType, pagination.page, pagination.limit]);

  // Fetch data when filters change
  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // Reset to page 1 when filters change (but not when page/limit change)
  useEffect(() => {
    setPagination((prev) => {
      if (prev.page === 1) return prev; // avoid unnecessary update
      return { ...prev, page: 1 };
    });
  }, [debouncedSearch, selectedCategory, dateRange]);

  const goToPage = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const changeLimit = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setDateRange({ from: undefined, to: undefined });
  };

  const hasActiveFilters =
    searchQuery !== "" || selectedCategory !== "all" || dateRange.from || dateRange.to;

  return {
    bills,
    pagination,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    selectedCategory,
    setSelectedCategory,
    dateRange,
    setDateRange,
    dateFilterType,
    setDateFilterType,
    goToPage,
    changeLimit,
    clearFilters,
    hasActiveFilters,
    refetch: fetchBills,
  };
}

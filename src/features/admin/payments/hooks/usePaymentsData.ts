import { useState, useEffect, useCallback } from "react";

interface Payment {
  id: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  createdBy: string;
  studentCategory: {
    id: string;
    discountAmount: number;
    finalFee: number;
    totalPaid: number;
    student: {
      id: string;
      fullname: string;
      email: string;
      contact_number_student: string;
    };
    subCategory: {
      id: string;
      name: string;
      fee: number;
      category: {
        id: string;
        name: string;
      };
    };
  };
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export function usePaymentsData() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  // Sorting
  const [sortBy, setSortBy] = useState("paymentDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        pageSize: pagination.pageSize.toString(),
        search: debouncedSearch,
        category: selectedCategory,
        sortBy,
        sortOrder,
      });

      if (dateRange.from) {
        params.append("dateFrom", dateRange.from.toISOString());
      }
      if (dateRange.to) {
        params.append("dateTo", dateRange.to.toISOString());
      }

      const response = await fetch(`/api/students/payments?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }

      const data = await response.json();
      setPayments(data.payments);
      setPagination({
        currentPage: data.currentPage,
        pageSize: data.pageSize,
        totalCount: data.totalCount,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.currentPage,
    pagination.pageSize,
    debouncedSearch,
    selectedCategory,
    dateRange,
    sortBy,
    sortOrder,
  ]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (pagination.currentPage !== 1) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }
  }, [debouncedSearch, selectedCategory, dateRange]);

  const goToPage = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changePageSize = (pageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize, currentPage: 1 }));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setDateRange({ from: undefined, to: undefined });
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "all" ||
    dateRange.from !== undefined ||
    dateRange.to !== undefined;

  return {
    payments,
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
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    goToPage,
    changePageSize,
    clearFilters,
    hasActiveFilters,
    refetch: fetchPayments,
  };
}

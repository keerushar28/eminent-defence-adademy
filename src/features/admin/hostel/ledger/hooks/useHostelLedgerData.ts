import { useState, useEffect, useCallback } from "react";
import { HostelLedgerStudent, HostelLedgerSummary } from "../types";

interface UseHostelLedgerDataParams {
  initialStudents?: HostelLedgerStudent[];
  initialSummary?: HostelLedgerSummary;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useHostelLedgerData({ initialStudents = [], initialSummary }: UseHostelLedgerDataParams = {}) {
  const [students, setStudents] = useState<HostelLedgerStudent[]>(initialStudents);
  const [summary, setSummary] = useState<HostelLedgerSummary | null>(initialSummary || null);
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
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roomFilter, setRoomFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [subcategoryFilter, setSubcategoryFilter] = useState("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Filter options
  const [rooms, setRooms] = useState<string[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [subcategories, setSubcategories] = useState<Array<{ id: string; name: string; categoryId: string }>>(
    []
  );
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch filter options
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch("/api/hostel/ledger/filters");
        if (response.ok) {
          const data = await response.json();
          setRooms(data.rooms);
          setCategories(data.categories || []);
          setSubcategories(data.subcategories || []);
          setPaymentMethods(data.paymentMethods);
        }
      } catch (err) {
        console.error("Error fetching filters:", err);
      }
    };

    fetchFilters();
  }, []);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/hostel/ledger/summary");
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  }, []);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: debouncedSearch,
        status: statusFilter,
        roomNumber: roomFilter,
        category: categoryFilter,
        subcategory: subcategoryFilter,
        paymentMethod: paymentMethodFilter,
      });

      if (startDate) {
        params.append("startDate", startDate.toISOString());
      }
      if (endDate) {
        params.append("endDate", endDate.toISOString());
      }

      const response = await fetch(`/api/hostel/ledger?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      setStudents(data.students);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, statusFilter, roomFilter, categoryFilter, subcategoryFilter, paymentMethodFilter, startDate, endDate]);

  // Fetch data when filters change
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Fetch summary on mount
  useEffect(() => {
    if (!summary) {
      fetchSummary();
    }
  }, [summary, fetchSummary]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, statusFilter, roomFilter, categoryFilter, subcategoryFilter, paymentMethodFilter, startDate, endDate]);

  const goToPage = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const changeLimit = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setRoomFilter("ALL");
    setCategoryFilter("ALL");
    setSubcategoryFilter("ALL");
    setPaymentMethodFilter("ALL");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "ALL" ||
    roomFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    subcategoryFilter !== "ALL" ||
    paymentMethodFilter !== "ALL" ||
    startDate !== undefined ||
    endDate !== undefined;

  return {
    students,
    summary,
    pagination,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    roomFilter,
    setRoomFilter,
    categoryFilter,
    setCategoryFilter,
    subcategoryFilter,
    setSubcategoryFilter,
    paymentMethodFilter,
    setPaymentMethodFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    rooms,
    categories,
    subcategories,
    paymentMethods,
    goToPage,
    changeLimit,
    clearFilters,
    hasActiveFilters,
    refetch: fetchStudents,
    refetchSummary: fetchSummary,
  };
}

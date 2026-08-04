import { useState, useEffect, useCallback } from "react";
import { LedgerStudent, LedgerSummary, getLedgerCategories, getLedgerSubCategories, getLedgerPaymentMethods } from "../actions/ledger-actions";

interface UseLedgerDataParams {
  initialStudents?: LedgerStudent[];
  initialSummary?: LedgerSummary;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useLedgerData({ initialStudents = [], initialSummary }: UseLedgerDataParams = {}) {
  const [students, setStudents] = useState<LedgerStudent[]>(initialStudents);
  const [summary, setSummary] = useState<LedgerSummary | null>(initialSummary || null);
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
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [subCategoryFilter, setSubCategoryFilter] = useState("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");

  // Filter options
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [subCategories, setSubCategories] = useState<{ id: string; name: string; categoryId: string }[]>([]);
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
        const [categoriesData, subCategoriesData, paymentMethodsData] = await Promise.all([
          getLedgerCategories(),
          getLedgerSubCategories(),
          getLedgerPaymentMethods(),
        ]);
        setCategories(categoriesData);
        setSubCategories(subCategoriesData);
        setPaymentMethods(paymentMethodsData);
      } catch (err) {
        console.error("Error fetching filters:", err);
      }
    };

    fetchFilters();
  }, []);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/students/ledger/summary");
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
        category: categoryFilter,
        subCategory: subCategoryFilter,
        paymentMethod: paymentMethodFilter,
      });

      const response = await fetch(`/api/students/ledger?${params}`);
      
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
  }, [pagination.page, pagination.limit, debouncedSearch, statusFilter, categoryFilter, subCategoryFilter, paymentMethodFilter]);

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
  }, [debouncedSearch, statusFilter, categoryFilter, subCategoryFilter, paymentMethodFilter]);

  const goToPage = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const changeLimit = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setSubCategoryFilter("ALL");
    setPaymentMethodFilter("ALL");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    subCategoryFilter !== "ALL" ||
    paymentMethodFilter !== "ALL";

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
    categoryFilter,
    setCategoryFilter,
    subCategoryFilter,
    setSubCategoryFilter,
    paymentMethodFilter,
    setPaymentMethodFilter,
    categories,
    subCategories,
    paymentMethods,
    goToPage,
    changeLimit,
    clearFilters,
    hasActiveFilters,
    refetch: fetchStudents,
    refetchSummary: fetchSummary,
  };
}

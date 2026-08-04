import { useState, useCallback, useEffect, useRef } from "react";
import { ExpenseEntry, ExpenseSummary, DateRangeFilter } from "../types/expense";
import { getExpenseEntries, getExpenseSummary, getExpenseCategories } from "../actions/expense-actions";

interface UseExpenseLedgerDataProps {
  initialEntries?: ExpenseEntry[];
  initialSummary?: ExpenseSummary;
}

export function useExpenseLedgerData({ initialEntries = [], initialSummary }: UseExpenseLedgerDataProps) {
  const [entries, setEntries] = useState<ExpenseEntry[]>(initialEntries);
  const [summary, setSummary] = useState<ExpenseSummary | null>(initialSummary || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeFilter>({ type: "ALL" });
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  // Debounce timer for search
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await getExpenseCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch data function
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [entriesData, summaryData] = await Promise.all([
        getExpenseEntries(
          dateRange,
          categoryFilter === "ALL" ? undefined : categoryFilter,
          searchQuery || undefined,
          page,
          limit
        ),
        getExpenseSummary(
          dateRange,
          categoryFilter === "ALL" ? undefined : categoryFilter
        ),
      ]);

      setEntries(entriesData.entries);
      setTotal(entriesData.total);
      setTotalPages(entriesData.totalPages);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch expense data");
    } finally {
      setLoading(false);
    }
  }, [dateRange, categoryFilter, searchQuery, page, limit]);

  // Debounced search and filter changes (not for page/limit changes)
  useEffect(() => {
    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchData();
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Reset to page 1 when filters change
    if (page !== 1) {
      setPage(1);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      fetchData();
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, dateRange, categoryFilter]);

  // Fetch when page or limit changes (no debounce)
  useEffect(() => {
    if (!isInitialMount.current) {
      fetchData();
    }
  }, [page, limit]);

  const handleDateRangeChange = (newRange: DateRangeFilter) => {
    setDateRange(newRange);
    setPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setCategoryFilter(cat);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateRange({ type: "ALL" });
    setCategoryFilter("ALL");
    setPage(1);
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    dateRange.type !== "ALL" ||
    categoryFilter !== "ALL";

  return {
    entries,
    summary,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    loading,
    error,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange: handleDateRangeChange,
    categoryFilter,
    setCategoryFilter: handleCategoryChange,
    categories,
    goToPage: setPage,
    changeLimit: setLimit,
    clearFilters,
    hasActiveFilters,
  };
}

import { useState, useCallback, useEffect, useRef } from "react";
import { LedgerEntry, LedgerSummary, DateRangeFilter } from "../types";
import { getLedgerEntries, getLedgerSummary, getPaymentMethods, getPaymentSources, getCategories, getSubCategories } from "../actions/ledger-actions";

interface UseLedgerDataProps {
  initialEntries?: LedgerEntry[];
  initialSummary?: LedgerSummary;
}

export function useLedgerData({ initialEntries = [], initialSummary }: UseLedgerDataProps) {
  const [entries, setEntries] = useState<LedgerEntry[]>(initialEntries);
  const [summary, setSummary] = useState<LedgerSummary | null>(initialSummary || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeFilter>({ type: "ALL" });
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [paymentSources, setPaymentSources] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [subCategoryFilter, setSubCategoryFilter] = useState("ALL");
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [subCategories, setSubCategories] = useState<Array<{ id: string; name: string; categoryId: string; categoryName: string }>>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Debounce timer for search
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Fetch payment methods, sources, and categories on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [methods, sources, cats] = await Promise.all([
          getPaymentMethods(),
          getPaymentSources(),
          getCategories(),
        ]);
        setPaymentMethods(methods);
        setPaymentSources(sources);
        setCategories(cats);
      } catch (err) {
        console.error("Error fetching options:", err);
      }
    };
    fetchOptions();
  }, []);

  // Fetch sub-categories when category filter changes
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (categoryFilter === "ALL") {
        const allSubCats = await getSubCategories();
        setSubCategories(allSubCats);
      } else {
        const cat = categories.find((c) => c.name === categoryFilter);
        if (cat) {
          const subCats = await getSubCategories(cat.id);
          setSubCategories(subCats);
        }
      }
      setSubCategoryFilter("ALL");
    };
    fetchSubCategories();
  }, [categoryFilter, categories]);

  // Fetch data function
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [entriesData, summaryData] = await Promise.all([
        getLedgerEntries(
          dateRange,
          paymentMethodFilter === "ALL" ? undefined : paymentMethodFilter,
          sourceFilter === "ALL" ? undefined : (sourceFilter as "STUDENT_CATEGORY" | "HOSTEL" | "INVENTORY_ISSUANCE"),
          searchQuery || undefined,
          categoryFilter === "ALL" ? undefined : categoryFilter,
          subCategoryFilter === "ALL" ? undefined : subCategoryFilter,
          page,
          limit
        ),
        getLedgerSummary(
          dateRange,
          paymentMethodFilter === "ALL" ? undefined : paymentMethodFilter,
          sourceFilter === "ALL" ? undefined : (sourceFilter as "STUDENT_CATEGORY" | "HOSTEL" | "INVENTORY_ISSUANCE"),
          categoryFilter === "ALL" ? undefined : categoryFilter,
          subCategoryFilter === "ALL" ? undefined : subCategoryFilter
        ),
      ]);

      setEntries(entriesData.entries);
      setTotal(entriesData.total);
      setTotalPages(entriesData.totalPages);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch ledger data");
    } finally {
      setLoading(false);
    }
  }, [dateRange, paymentMethodFilter, sourceFilter, searchQuery, categoryFilter, subCategoryFilter, page, limit]);

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
  }, [searchQuery, dateRange, paymentMethodFilter, sourceFilter, categoryFilter, subCategoryFilter]);

  // Fetch when page or limit changes (no debounce)
  useEffect(() => {
    if (!isInitialMount.current) {
      fetchData();
    }
  }, [page, limit]);

  // Fetch on manual refresh (no debounce, preserves filters and page)
  useEffect(() => {
    if (refreshKey > 0) {
      fetchData();
    }
  }, [refreshKey]);

  const handleDateRangeChange = (newRange: DateRangeFilter) => {
    setDateRange(newRange);
    setPage(1);
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethodFilter(method);
    setPage(1);
  };

  const handleSourceChange = (source: string) => {
    setSourceFilter(source);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateRange({ type: "ALL" });
    setPaymentMethodFilter("ALL");
    setSourceFilter("ALL");
    setCategoryFilter("ALL");
    setSubCategoryFilter("ALL");
    setPage(1);
  };

  const refresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    dateRange.type !== "ALL" ||
    paymentMethodFilter !== "ALL" ||
    sourceFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    subCategoryFilter !== "ALL";

  const handleCategoryChange = (cat: string) => {
    setCategoryFilter(cat);
    setPage(1);
  };

  const handleSubCategoryChange = (subCat: string) => {
    setSubCategoryFilter(subCat);
    setPage(1);
  };

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
    paymentMethodFilter,
    setPaymentMethodFilter: handlePaymentMethodChange,
    sourceFilter,
    setSourceFilter: handleSourceChange,
    categoryFilter,
    setCategoryFilter: handleCategoryChange,
    subCategoryFilter,
    setSubCategoryFilter: handleSubCategoryChange,
    paymentMethods,
    paymentSources,
    categories,
    subCategories,
    goToPage: setPage,
    changeLimit: setLimit,
    clearFilters,
    hasActiveFilters,
    refresh,
  };
}

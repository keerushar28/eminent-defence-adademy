import { useState, useEffect, useCallback } from "react";
import { IStudent } from "../types/types";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useStudentsData() {
  const [students, setStudents] = useState<IStudent[]>([]);
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
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [registrationSort, setRegistrationSort] = useState<"asc" | "desc">("desc");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [subCategories, setSubCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: debouncedSearch,
        gender: genderFilter,
        sortBy: "createdAt",
        sortOrder: registrationSort,
      });

      if (categoryFilter) {
        params.append("categoryId", categoryFilter);
      }

      if (subCategoryFilter) {
        params.append("subCategoryId", subCategoryFilter);
      }

      const response = await fetch(`/api/students?${params}`);

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
  }, [pagination.page, pagination.limit, debouncedSearch, genderFilter, registrationSort, categoryFilter, subCategoryFilter]);

  // Fetch data when filters change
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch("/api/categories?includeSubcategories=true");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Update subcategories when category changes
  useEffect(() => {
    if (categoryFilter && categoryFilter !== "all-categories") {
      const selected = categories.find((c) => c.id === categoryFilter);
      if (selected && "subCategories" in selected) {
        setSubCategories((selected as any).subCategories || []);
      }
      setSubCategoryFilter("");
    } else {
      setSubCategories([]);
      setSubCategoryFilter("");
    }
  }, [categoryFilter, categories]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, genderFilter, categoryFilter, subCategoryFilter]);

  const goToPage = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const changeLimit = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setGenderFilter("ALL");
    setRegistrationSort("desc");
    setCategoryFilter("");
    setSubCategoryFilter("");
  };

  const hasActiveFilters = searchQuery !== "" || genderFilter !== "ALL" || registrationSort !== "desc" || categoryFilter !== "" || subCategoryFilter !== "";

  return {
    students,
    pagination,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    genderFilter,
    setGenderFilter,
    registrationSort,
    setRegistrationSort,
    categoryFilter,
    setCategoryFilter,
    subCategoryFilter,
    setSubCategoryFilter,
    categories,
    subCategories,
    loadingCategories,
    goToPage,
    changeLimit,
    clearFilters,
    hasActiveFilters,
    refetch: fetchStudents,
  };
}

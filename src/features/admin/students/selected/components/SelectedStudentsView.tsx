"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/core/components/card";
import { Input } from "@/features/core/components/input";
import { Button } from "@/features/core/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/core/components/select";
import { Search, Loader2, X, Trash2 } from "lucide-react";
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker";
import { getSelectedStudents } from "../../actions/selected-students-actions";
import SelectedStudentsTable from "./SelectedStudentsTable";
import Pagination from "@/features/core/components/shared/pagination";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  description?: string;
  subCategories: SubCategory[];
}

interface SubCategory {
  id: string;
  name: string;
  fee: number;
}

interface Student {
  id: string;
  fullname: string;
  email: string;
  citizenship_number: string;
  contact_number_student: string;
  gender: string;
  selectedAt: Date | string | null;
  subCategorySelections?: Array<{
    id: string;
    subCategory: {
      id: string;
      name: string;
      fee: number;
      category: {
        id: string;
        name: string;
      };
    };
  }>;
}

export default function SelectedStudentsView() {
  const [students, setStudents] = useState<Student[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch categories with subcategories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories?includeSubcategories=true");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const result = await getSelectedStudents(
        debouncedSearch || undefined,
        selectedSubCategory ? [selectedSubCategory] : undefined,
        startDate,
        endDate,
        page,
        limit
      );
      setStudents(result.students as Student[]);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      toast.error("Failed to fetch selected students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch, selectedSubCategory, startDate, endDate]);


  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedSubCategory("");
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(1);
  };

  const hasActiveFilters = searchQuery || selectedSubCategory || startDate || endDate;

  return (
    <div className="space-y-6">
      {/* Filter Card */}
      <Card className="border shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or citizenship number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-border w-full"
            />
            {searchQuery && debouncedSearch !== searchQuery && (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Subcategory Filter */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Filter by Subcategory
            </label>
            <Select
              value={selectedSubCategory || "all"}
              onValueChange={(value) => {
                setSelectedSubCategory(value === "all" ? "" : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Subcategories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {categories.map((category) => (
                  category.subCategories?.map((subCategory) => (
                    <SelectItem key={subCategory.id} value={subCategory.id}>
                      {category.name}: {subCategory.name}
                    </SelectItem>
                  ))
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <div className="min-w-0">
              <label className="text-sm font-medium text-muted-foreground mb-2 block truncate">
                Start Date
              </label>
              <NepaliDatePicker
                value={startDate}
                onChange={(date) => {
                  setStartDate(date);
                  setPage(1);
                }}
                placeholder="From"
                className="w-full text-sm"
              />
            </div>
            <div className="min-w-0">
              <label className="text-sm font-medium text-muted-foreground mb-2 block truncate">
                End Date
              </label>
              <NepaliDatePicker
                value={endDate}
                onChange={(date) => {
                  setEndDate(date);
                  setPage(1);
                }}
                placeholder="To"
                className="w-full text-sm"
              />
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Students Table */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            Selected Students
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({total} {total === 1 ? "student" : "students"})
            </span>
          </CardTitle>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          )}
        </div>

        <SelectedStudentsTable
          students={students}
          loading={loading}
          onRefresh={fetchStudents}
        />

        {/* Pagination */}
        {total > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={limit}
            onPageChange={setPage}
            onItemsPerPageChange={setLimit}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

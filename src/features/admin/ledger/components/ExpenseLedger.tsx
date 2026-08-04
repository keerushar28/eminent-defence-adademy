"use client";

import { useState, useEffect, useRef } from "react";
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
import { Search, Filter, X, Loader2 } from "lucide-react";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import ExpenseTable from "./ExpenseTable";
import ExpenseSummaryCards from "./ExpenseSummaryCards";
import ExpenseBreakdownChart from "./ExpenseBreakdownChart";
import DateRangeFilter from "./DateRangeFilter";
import Pagination from "@/features/core/components/shared/pagination";
import { useExpenseLedgerData } from "../hooks/useExpenseLedgerData";

export default function ExpenseLedger() {
  const {
    entries,
    summary,
    pagination,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    categoryFilter,
    setCategoryFilter,
    categories,
    goToPage,
    changeLimit,
    clearFilters,
    hasActiveFilters,
  } = useExpenseLedgerData({});

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const setSearchQueryRef = useRef(setSearchQuery);

  // Keep ref updated
  useEffect(() => {
    setSearchQueryRef.current = setSearchQuery;
  }, [setSearchQuery]);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setSearchQueryRef.current(localSearchQuery);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [localSearchQuery]);

  // Update local state when external searchQuery changes (e.g., from clear filters)
  useEffect(() => {
    if (searchQuery !== localSearchQuery) {
      setLocalSearchQuery(searchQuery);
    }
  }, [searchQuery]);

  const handleExport = () => {
    const headers = [
      "Bill Date",
      "Category",
      "Billing Title",
      "Vendor",
      "Items",
      "Period Start",
      "Period End",
      "Amount",
      "Description",
    ];

    // Helper function to escape CSV fields
    const escapeCSVField = (field: string | number): string => {
      const fieldStr = String(field);
      if (fieldStr.includes(",") || fieldStr.includes('"') || fieldStr.includes("\n")) {
        return `"${fieldStr.replace(/"/g, '""')}"`;
      }
      return fieldStr;
    };

    const rows = entries.map((entry) => [
      formatNepaliDateFromDate(new Date(entry.billDate)),
      entry.categoryName,
      entry.billingTitle || "-",
      entry.vendorName || "-",
      entry.items || "-",
      formatNepaliDateFromDate(new Date(entry.periodStartDate)),
      formatNepaliDateFromDate(new Date(entry.periodEndDate)),
      entry.amount,
      entry.description || "",
    ]);

    // Calculate total expense
    const totalExpense = entries.reduce((sum, entry) => sum + entry.amount, 0);

    // Add total row
    const totalRow = ["", "", "", "", "", "", "", totalExpense, ""];

    const csvContent = [
      headers.map(escapeCSVField).join(","),
      ...rows.map((row) => row.map(escapeCSVField).join(",")),
      totalRow.map(escapeCSVField).join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense-ledger-${formatNepaliDateFromDate(new Date())}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {summary && <ExpenseSummaryCards summary={summary} />}

      {/* Filter Panel */}
      <Card className="border shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filters & Search</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by category, title or description..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="pl-9 border-border w-full"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Date Range */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Date Range
              </label>
              <DateRangeFilter
                value={dateRange}
                onChange={setDateRange}
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Category
              </label>
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger className="border-border w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Export Button */}
            <div className="flex items-end">
              <Button
                onClick={handleExport}
                variant="default"
                className="w-full"
              >
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Chart */}
      {summary && <ExpenseBreakdownChart summary={summary} />}

      {/* Expense Table */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            Expense Entries
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({pagination.total} {pagination.total === 1 ? "entry" : "entries"})
            </span>
          </CardTitle>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          )}
        </div>

        <ExpenseTable entries={entries} loading={loading} itemsPerPage={pagination.limit} />

        {/* Pagination */}
        {pagination.total > 0 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={goToPage}
            onItemsPerPageChange={changeLimit}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

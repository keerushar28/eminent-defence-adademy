"use client";

import { useState } from "react";
import { Card, CardContent, CardTitle } from "@/features/core/components/card";
import LedgerTable from "./LedgerTable";
import SummaryCards from "./SummaryCards";
import BreakdownCharts from "./BreakdownCharts";
import FilterPanel from "./FilterPanel";
import AddExtraIncomeDialog from "./AddExtraIncomeDialog";
import Pagination from "@/features/core/components/shared/pagination";
import { useLedgerData } from "../hooks/useLedgerData";
import { Button } from "@/features/core/components/button";
import { Loader2, Plus } from "lucide-react";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";

export default function MainLedger() {
  const [extraIncomeOpen, setExtraIncomeOpen] = useState(false);

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
    paymentMethodFilter,
    setPaymentMethodFilter,
    sourceFilter,
    setSourceFilter,
    categoryFilter,
    setCategoryFilter,
    subCategoryFilter,
    setSubCategoryFilter,
    paymentMethods,
    paymentSources,
    categories,
    subCategories,
    goToPage,
    changeLimit,
    clearFilters,
    hasActiveFilters,
    refresh,
  } = useLedgerData({});

  const handleExport = () => {
    const headers = [
      "Date",
      "Paid By",
      "Email",
      "Source",
      "Category",
      "Sub Category",
      "Payment Method",
      "Amount",
      "Reference Number",
      "Notes",
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
      formatNepaliDateFromDate(new Date(entry.paymentDate)),
      entry.paidBy,
      entry.paidByEmail || "",
      entry.source.replace("_", " "),
      entry.category || "",
      entry.subCategory || "",
      entry.paymentMethod.replace("_", " "),
      entry.amount,
      entry.referenceNumber || "",
      entry.notes || "",
    ]);

    // Calculate total income
    const totalIncome = entries.reduce((sum, entry) => sum + entry.amount, 0);

    // Add total row
    const totalRow = ["", "", "", "", "", "", "TOTAL", totalIncome, "", ""];

    const csvContent = [
      headers.map(escapeCSVField).join(","),
      ...rows.map((row) => row.map(escapeCSVField).join(",")),
      totalRow.map(escapeCSVField).join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `main-ledger-${formatNepaliDateFromDate(new Date())}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredSubCategories = subCategories.filter(
    (subCat) => categoryFilter === "ALL" || subCat.categoryName === categoryFilter
  );

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
      {summary && <SummaryCards summary={summary} />}

      {/* Filter Panel */}
      <FilterPanel
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        paymentMethodFilter={paymentMethodFilter}
        onPaymentMethodChange={setPaymentMethodFilter}
        sourceFilter={sourceFilter}
        onSourceChange={setSourceFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        subCategoryFilter={subCategoryFilter}
        onSubCategoryChange={setSubCategoryFilter}
        paymentMethods={paymentMethods}
        paymentSources={paymentSources}
        categories={categories}
        subCategories={filteredSubCategories}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        loading={loading}
        onExport={handleExport}
      />

      {/* Add Extra Income */}
      <div className="flex justify-end">
        <Button onClick={() => setExtraIncomeOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Extra Income
        </Button>
      </div>

      <AddExtraIncomeDialog
        isOpen={extraIncomeOpen}
        onClose={() => setExtraIncomeOpen(false)}
        onSuccess={refresh}
      />

      {/* Breakdown Charts */}
      {summary && <BreakdownCharts summary={summary} />}

      {/* Ledger Table */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            Ledger Entries
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

        <LedgerTable entries={entries} loading={loading} itemsPerPage={pagination.limit} />

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

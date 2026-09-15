"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/features/core/components/card";
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
import DateRangeFilter from "./DateRangeFilter";
import { DateRangeFilter as DateRangeFilterType } from "../types";

interface FilterPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateRange: DateRangeFilterType;
  onDateRangeChange: (range: DateRangeFilterType) => void;
  paymentMethodFilter: string;
  onPaymentMethodChange: (method: string) => void;
  sourceFilter: string;
  onSourceChange: (source: string) => void;
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  subCategoryFilter: string;
  onSubCategoryChange: (subCategory: string) => void;
  paymentMethods: string[];
  paymentSources: string[];
  categories: Array<{ id: string; name: string }>;
  subCategories: Array<{
    id: string;
    name: string;
    categoryId: string;
    categoryName: string;
  }>;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  loading?: boolean;
  onExport?: () => void;
}

export default function FilterPanel({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  paymentMethodFilter,
  onPaymentMethodChange,
  sourceFilter,
  onSourceChange,
  categoryFilter,
  onCategoryChange,
  subCategoryFilter,
  onSubCategoryChange,
  paymentMethods,
  paymentSources,
  categories,
  subCategories,
  onClearFilters,
  hasActiveFilters,
  loading,
  onExport,
}: FilterPanelProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const onSearchChangeRef = useRef(onSearchChange);

  // Keep ref updated
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      onSearchChangeRef.current(localSearchQuery);
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

  return (
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
              onClick={onClearFilters}
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
            placeholder="Search by name, email, or reference..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-9 border-border w-full"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Date Range — full width so custom pickers have room */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Date Range
          </label>
          <DateRangeFilter value={dateRange} onChange={onDateRangeChange} />
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Payment Method */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Payment Method
            </label>
            <Select
              value={paymentMethodFilter}
              onValueChange={onPaymentMethodChange}
            >
              <SelectTrigger className="border-border w-full">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Methods</SelectItem>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Income Source */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Income Source
            </label>
            <Select value={sourceFilter} onValueChange={onSourceChange}>
              <SelectTrigger className="border-border w-full">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sources</SelectItem>
                {paymentSources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Category
            </label>
            <Select value={categoryFilter} onValueChange={onCategoryChange}>
              <SelectTrigger className="border-border w-full">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub Category */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Sub Category
            </label>
            <Select
              value={subCategoryFilter}
              onValueChange={onSubCategoryChange}
            >
              <SelectTrigger className="border-border w-full">
                <SelectValue placeholder="All Sub Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sub Categories</SelectItem>
                {subCategories.map((subCat) => (
                  <SelectItem key={subCat.id} value={subCat.name}>
                    {subCat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Export Button */}
          <div className="flex items-end">
            <Button onClick={onExport} variant="default" className="w-full">
              Export
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

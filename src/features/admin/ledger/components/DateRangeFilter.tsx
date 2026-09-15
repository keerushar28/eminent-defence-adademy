"use client";

import { DateRangeFilter as DateRangeFilterType } from "../types/expense";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/core/components/select";
import { Button } from "@/features/core/components/button";
import { useState } from "react";
import * as React from "react";
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

interface DateRangeFilterProps {
  value: DateRangeFilterType;
  onChange: (filter: DateRangeFilterType) => void;
  disabled?: boolean;
}

export default function DateRangeFilter({ value, onChange, disabled }: DateRangeFilterProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: value.startDate,
    to: value.endDate,
  });
  const [applying, setApplying] = useState(false);

  // Sync local state only when the parent clears filters (type changes to ALL)
  // or when the type changes to CUSTOM from outside (e.g. clear filters resets to ALL).
  // We intentionally do NOT sync startDate/endDate back into local state after Apply
  // because that would create a feedback loop: Apply → parent updates → effect fires → re-sets state.
  const prevTypeRef = React.useRef(value.type);
  React.useEffect(() => {
    if (value.type !== prevTypeRef.current) {
      prevTypeRef.current = value.type;
      if (value.type === "ALL") {
        setDateRange({ from: undefined, to: undefined });
      }
    }
  }, [value.type]);

  const handlePresetChange = (type: string) => {
    if (type === "CUSTOM") {
      // Just show the custom pickers — don't fire onChange until Apply is clicked
      onChange({ type: "CUSTOM", startDate: undefined, endDate: undefined });
    } else {
      // Switching to ALL: clear everything
      setDateRange({ from: undefined, to: undefined });
      onChange({ type: "ALL" });
    }
  };

  const handleCustomApply = () => {
    if (dateRange.from && dateRange.to) {
      const toUTCDate = (date: Date) =>
        new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

      const start = toUTCDate(dateRange.from);
      const end = toUTCDate(dateRange.to);

      setApplying(true);
      onChange({ type: "CUSTOM", startDate: start, endDate: end });

      // Give the data fetch a moment to kick off, then clear the loader and toast
      setTimeout(() => {
        setApplying(false);
        toast.success("Filter applied", {
          description: "Showing results for the selected date range.",
        });
      }, 600);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Select value={value.type} onValueChange={handlePresetChange} disabled={disabled}>
        <SelectTrigger className="border-border w-full">
          <SelectValue placeholder="Select date range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All</SelectItem>
          <SelectItem value="CUSTOM">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {value.type === "CUSTOM" && (
        <div className="flex flex-col md:flex-row gap-2 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">From</label>
            <NepaliDatePicker
              value={dateRange.from}
              onChange={(date) => {
                const isDate = date instanceof Date || (date && typeof date === "object" && typeof (date as Date).getTime === "function");
                setDateRange((prev) => ({ ...prev, from: isDate ? (date as Date) : prev.from }));
              }}
              placeholder="Select start date"
              className="w-full"
              mode="single"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">To</label>
            <NepaliDatePicker
              value={dateRange.to}
              onChange={(date) => {
                const isDate = date instanceof Date || (date && typeof date === "object" && typeof (date as Date).getTime === "function");
                setDateRange((prev) => ({ ...prev, to: isDate ? (date as Date) : prev.to }));
              }}
              placeholder="Select end date"
              className="w-full"
              mode="single"
            />
          </div>
          <Button
            type="button"
            onClick={handleCustomApply}
            disabled={disabled || applying || !dateRange.from || !dateRange.to}
            size="sm"
            className="w-full md:w-auto"
          >
            {applying ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin mr-1" />
                Applying...
              </>
            ) : (
              "Apply"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/features/core/components/dropdown-menu";
import { Button } from "@/features/core/components/button";
import { ChevronDown } from "lucide-react";

interface PaymentFilterProps {
  onFilterChange?: (filter: "all" | "category" | "hostel") => void;
}

export function PaymentFilter({ onFilterChange }: PaymentFilterProps) {
  const [filter, setFilter] = useState<"all" | "category" | "hostel">("all");

  const handleFilterChange = (newFilter: "all" | "category" | "hostel") => {
    setFilter(newFilter);
    onFilterChange?.(newFilter);
  };

  const filterLabels = {
    all: "All Payments",
    category: "Category Payments",
    hostel: "Hostel Payments",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {filterLabels[filter]}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleFilterChange("all")}>
          All Payments
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleFilterChange("category")}>
          Category Payments
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleFilterChange("hostel")}>
          Hostel Payments
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

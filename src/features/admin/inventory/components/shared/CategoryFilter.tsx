"use client";

import { Button } from "@/features/core/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/features/core/components/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { IInventoryCategory } from "../../types/inventory-types";

interface CategoryFilterProps {
  categories: IInventoryCategory[];
  selectedCategoryId?: string;
  onCategoryChange: (categoryId: string | undefined) => void;
  showAllOption?: boolean;
}

export default function CategoryFilter({
  categories,
  selectedCategoryId,
  onCategoryChange,
  showAllOption = true,
}: CategoryFilterProps) {
  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {selectedCategory ? selectedCategory.name : "All Categories"}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {showAllOption && (
          <DropdownMenuItem onClick={() => onCategoryChange(undefined)}>
            All Categories
          </DropdownMenuItem>
        )}
        {categories.map((category) => (
          <DropdownMenuItem
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
          >
            {category.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

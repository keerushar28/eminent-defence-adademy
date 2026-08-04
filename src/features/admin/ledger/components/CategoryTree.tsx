"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { TableCell, TableRow } from "@/features/core/components/table";
import { cn } from "@/features/core/lib/utils";

interface SubCategory {
  name: string;
  amount: number;
}

interface CategoryTreeItem {
  name: string;
  amount: number;
  subCategories: SubCategory[];
}

interface CategoryTreeProps {
  data: CategoryTreeItem[];
  formatAmount: (amount: number) => string;
  prefix: string;
  startIndex?: number;
}

export function CategoryTree({ data, formatAmount, prefix, startIndex = 1 }: CategoryTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  let currentIndex = startIndex;

  return (
    <>
      {data.map((category) => {
        const isExpanded = expandedCategories.has(category.name);
        const hasSubCategories = category.subCategories.length > 0;
        const categoryIndex = currentIndex++;

        return (
          <>
            {/* Main Category Row */}
            <TableRow
              key={category.name}
              className={cn(
                "hover:bg-muted/50 transition-colors",
                hasSubCategories && "cursor-pointer"
              )}
              onClick={() => hasSubCategories && toggleCategory(category.name)}
            >
              <TableCell className="w-16 text-center">{categoryIndex}</TableCell>
              <TableCell className="min-w-0">
                <div className="flex items-center gap-2">
                  {hasSubCategories && (
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform duration-200 shrink-0",
                        isExpanded && "rotate-90"
                      )}
                    />
                  )}
                  <span className="font-medium truncate">
                    {prefix} {category.name}
                  </span>
                  {hasSubCategories && (
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">
                      {category.subCategories.length} subcategories
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-mono font-medium w-32">
                {formatAmount(category.amount)}
              </TableCell>
              <TableCell className="w-20 text-center">-</TableCell>
            </TableRow>

            {/* Subcategory Rows */}
            {hasSubCategories && isExpanded && category.subCategories.map((subCategory, subIndex) => (
              <TableRow
                key={`${category.name}-${subCategory.name}`}
                className="bg-muted/20 hover:bg-muted/30 transition-colors"
              >
                <TableCell className="w-16 text-center text-muted-foreground text-sm">
                  {categoryIndex}.{subIndex + 1}
                </TableCell>
                <TableCell className="min-w-0">
                  <div className="flex items-center gap-2 pl-6">
                    <span className="text-muted-foreground shrink-0">└─</span>
                    <span className="text-sm truncate">{subCategory.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm w-32">
                  {formatAmount(subCategory.amount)}
                </TableCell>
                <TableCell className="w-20 text-center text-muted-foreground">-</TableCell>
              </TableRow>
            ))}
          </>
        );
      })}
    </>
  );
}
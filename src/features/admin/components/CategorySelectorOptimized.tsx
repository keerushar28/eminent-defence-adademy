"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, X, AlertCircle, ChevronDown } from "lucide-react";
import { cn } from "@/features/core/lib/utils";
import { Button } from "@/features/core/components/button";
import { Input } from "@/features/core/components/input";
import { Badge } from "@/features/core/components/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/core/components/popover";
import { ScrollArea } from "@/features/core/components/scroll-area";
import { useDebounce } from "@/features/core/hooks/useDebounce";

interface CategoryOption {
  id: string;
  remaining: number;
  finalFee: number;
  totalPaid: number;
  discountAmount: number;
  isActive?: boolean;
  subCategory: {
    id: string;
    name: string;
    fee: number;
    category: {
      id: string;
      name: string;
    };
  };
}

interface CategorySelectorOptimizedProps {
  value: string;
  onValueChange: (value: string) => void;
  categories: CategoryOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  loading?: boolean;
}

export default function CategorySelectorOptimized({
  value,
  onValueChange,
  categories,
  disabled = false,
  placeholder = "Select category...",
  className,
  loading = false,
}: CategorySelectorOptimizedProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption | null>(null);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filter categories based on search
  const filteredCategories = categories.filter((cat) => {
    const searchLower = debouncedSearch.toLowerCase();
    return (
      cat.subCategory.name.toLowerCase().includes(searchLower) ||
      cat.subCategory.category.name.toLowerCase().includes(searchLower)
    );
  });

  // Update selected category when value changes
  useEffect(() => {
    if (value) {
      const found = categories.find((c) => c.id === value);
      setSelectedCategory(found || null);
    } else {
      setSelectedCategory(null);
    }
  }, [value, categories]);

  const handleSelect = (category: CategoryOption) => {
    setSelectedCategory(category);
    onValueChange(category.id);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-auto min-h-[40px] py-1.5 px-3 border",
            className
          )}
          disabled={disabled || loading}
        >
          {selectedCategory ? (
            <div className="flex items-center gap-2 truncate flex-1 text-left">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {selectedCategory.subCategory.category.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {selectedCategory.subCategory.name} • NPR {selectedCategory.remaining.toLocaleString()}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[480px] p-0 max-h-[500px] flex flex-col border" align="start">
        <div className="flex flex-col h-full">
          {/* Search Input */}
          <div className="flex items-center border-b px-3 py-2 shrink-0 bg-muted/30">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              placeholder="Search category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 shadow-none focus-visible:ring-offset-0 h-8 px-0 text-sm bg-transparent"
              autoFocus
              disabled={loading}
            />
            {searchQuery && !loading && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-8 flex-1">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">Loading categories...</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">
                {categories.length === 0 ? "No categories available" : "No categories found"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {categories.length === 0
                  ? "This student has no pending fees"
                  : "Try adjusting your search"}
              </p>
            </div>
          ) : (
            /* Category List */
            <>
              <ScrollArea className="h-[350px]">
                <div className="p-1.5 space-y-1">
                  {filteredCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleSelect(category)}
                      className={cn(
                        "w-full flex flex-col cursor-pointer gap-1.5 p-2.5 rounded border transition-all text-left text-sm",
                        value === category.id
                          ? "bg-primary/5 border-primary/50 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-muted/40"
                      )}
                    >
                      {/* Category Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm truncate">
                              {category.subCategory.category.name}
                            </div>
                            {category.isActive === false && (
                              <Badge variant="destructive" className="text-xs shrink-0">
                                De-allocated
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {category.subCategory.name}
                          </div>
                        </div>
                        {value === category.id && (
                          <div className="shrink-0 mt-0.5">
                            <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-white" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fee Details */}
                      <div className="grid grid-cols-3 gap-1.5 text-xs bg-muted/40 p-1.5 rounded border border-border/50">
                        <div className="space-y-0.5">
                          <p className="text-muted-foreground text-xs">Final</p>
                          <p className="font-semibold">NPR {category.finalFee.toLocaleString()}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-muted-foreground text-xs">Paid</p>
                          <p className="font-semibold text-green-600">
                            NPR {category.totalPaid.toLocaleString()}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-muted-foreground text-xs">Remaining</p>
                          <p className="font-bold text-red-600">
                            NPR {category.remaining.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>

              {/* More Results Message */}
              {filteredCategories.length > 5 && (
                <div className="px-3 py-1.5 text-xs text-center text-muted-foreground bg-muted/30 border-t shrink-0">
                  Showing {filteredCategories.length} categories
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

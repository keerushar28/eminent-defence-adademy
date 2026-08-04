"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search, FolderOpen } from "lucide-react";
import { cn } from "@/features/core/lib/utils";
import { Button } from "@/features/core/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/features/core/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/core/components/popover";
import { IInventoryCategory } from "../../types/inventory-types";

interface CategorySelectorProps {
  categories: IInventoryCategory[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  showDescription?: boolean;
  className?: string;
}

export default function CategorySelector({
  categories,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select category...",
  showDescription = true,
  className,
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter categories based on search and type (only inventory categories)
  const filteredCategories = useMemo(() => {
    // First filter to only inventory type categories (not billing)
    const inventoryCategories = categories.filter(cat => cat.isBilling === false);
    
    if (!searchQuery) return inventoryCategories;

    const query = searchQuery.toLowerCase();
    return inventoryCategories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.description?.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  const selectedCategory = categories.find((category) => category.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled || categories.filter(cat => cat.isBilling === false).length === 0}
        >
          {selectedCategory ? (
            <span className="truncate">{selectedCategory.name}</span>
          ) : (
            <span className="text-muted-foreground">
              {categories.filter(cat => cat.isBilling === false).length === 0 ? "No inventory categories available" : placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search categories..."
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <CommandList>
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <FolderOpen className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">No categories found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {searchQuery
                    ? "Try adjusting your search"
                    : "Please create a category first"}
                </p>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredCategories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.id}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className="flex items-start gap-2 py-3"
                >
                  <Check
                    className={cn(
                      "mt-1 h-4 w-4 shrink-0",
                      value === category.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{category.name}</div>
                    {showDescription && category.description && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {category.description}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

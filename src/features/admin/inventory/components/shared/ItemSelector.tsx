"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search, Package } from "lucide-react";
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
import { Badge } from "@/features/core/components/badge";
import { IInventoryItem } from "../../types/inventory-types";

interface ItemSelectorProps {
  items: IInventoryItem[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  showStock?: boolean;
  showCategory?: boolean;
  showSKU?: boolean;
  filterByStock?: boolean; // Only show items with stock > 0
  className?: string;
}

export default function ItemSelector({
  items,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select item...",
  showStock = true,
  showCategory = true,
  showSKU = true,
  filterByStock = false,
  className,
}: ItemSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter items based on search and stock availability
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filter by stock if needed
    if (filterByStock) {
      filtered = filtered.filter((item) => item.currentStock > 0);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          item.category?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [items, searchQuery, filterByStock]);

  const selectedItem = items.find((item) => item.id === value);

  const getStockBadgeVariant = (item: IInventoryItem) => {
    if (item.currentStock === 0) return "destructive";
    if (item.currentStock <= item.minStockThreshold) return "secondary";
    return "default";
  };

  const getStockStatus = (item: IInventoryItem) => {
    if (item.currentStock === 0) return "Out of Stock";
    if (item.currentStock <= item.minStockThreshold) return "Low Stock";
    return "In Stock";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled || items.length === 0}
        >
          {selectedItem ? (
            <div className="flex items-center justify-between w-full">
              <span className="truncate">{selectedItem.name}</span>
              {showStock && (
                <Badge
                  variant={getStockBadgeVariant(selectedItem)}
                  className="ml-2 text-xs"
                >
                  {selectedItem.currentStock} {selectedItem.unit}
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">
              {items.length === 0 ? "No items available" : placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search items by name, SKU, or category..."
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <CommandList>
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Package className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">No items found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {searchQuery
                    ? "Try adjusting your search"
                    : "No items available to select"}
                </p>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className="flex items-start justify-between py-3"
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <Check
                      className={cn(
                        "mt-1 h-4 w-4 shrink-0",
                        value === item.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {showSKU && (
                          <span className="text-xs text-muted-foreground">
                            SKU: {item.sku}
                          </span>
                        )}
                        {showCategory && item.category && (
                          <Badge variant="outline" className="text-xs">
                            {item.category.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {showStock && (
                    <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                      <Badge
                        variant={getStockBadgeVariant(item)}
                        className="text-xs whitespace-nowrap"
                      >
                        {item.currentStock} {item.unit}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getStockStatus(item)}
                      </span>
                    </div>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

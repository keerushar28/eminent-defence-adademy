"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, X } from "lucide-react";
import { cn } from "@/features/core/lib/utils";
import { Button } from "@/features/core/components/button";
import { Input } from "@/features/core/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/core/components/popover";
import { ScrollArea } from "@/features/core/components/scroll-area";
import { Badge } from "@/features/core/components/badge";
import { useDebounce } from "@/features/core/hooks/useDebounce";

interface Allocation {
  id: string;
  isActive: boolean;
  student: {
    id: string;
    fullname: string;
    email: string;
  };
  bed: {
    id: string;
    bedNumber: string;
    pricePerDay: number;
    room: {
      id: string;
      roomNumber: string;
    };
  };
  allocationDate: Date;
  paidUntil: Date;
  payments?: Array<{ amount: number }>;
}

interface AllocationSelectorOptimizedProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  includeInactive?: boolean;
}

export default function AllocationSelectorOptimized({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select allocation...",
  className,
  includeInactive = false,
}: AllocationSelectorOptimizedProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch allocations from API
  const fetchAllocations = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        limit: "50",
        ...(includeInactive ? { includeInactive: "true" } : {}),
      });

      const response = await fetch(`/api/hostel/allocations/active?${params}`);
      if (!response.ok) throw new Error("Failed to fetch allocations");

      const data = await response.json();
      setAllocations(data.allocations || data);
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error("Error fetching allocations:", error);
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  // Fetch selected allocation details
  const fetchSelectedAllocation = useCallback(async (allocationId: string) => {
    try {
      const params = new URLSearchParams({ q: '', limit: '1000', ...(includeInactive ? { includeInactive: 'true' } : {}) })
      const response = await fetch(`/api/hostel/allocations/active?${params}`);
      if (!response.ok) return;

      const data = await response.json();
      const allocation = (data.allocations || data).find(
        (a: Allocation) => a.id === allocationId
      );
      if (allocation) setSelectedAllocation(allocation);
    } catch (error) {
      console.error("Error fetching selected allocation:", error);
    }
  }, [includeInactive]);

  // Fetch allocations when search changes
  useEffect(() => {
    if (open) {
      fetchAllocations(debouncedSearch);
    }
  }, [debouncedSearch, open, fetchAllocations]);

  // Fetch selected allocation on mount
  useEffect(() => {
    if (value && !selectedAllocation) {
      fetchSelectedAllocation(value);
    }
  }, [value, selectedAllocation, fetchSelectedAllocation]);

  // Load initial allocations when opened
  useEffect(() => {
    if (open && allocations.length === 0 && !loading) {
      fetchAllocations("");
    }
  }, [open, allocations.length, loading, fetchAllocations]);

  const handleSelect = (allocation: Allocation) => {
    setSelectedAllocation(allocation);
    onValueChange(allocation.id);
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
          className={cn("w-full justify-between h-auto min-h-[44px] py-2", className)}
          disabled={disabled}
        >
          {selectedAllocation ? (
            <div className="flex items-center gap-2 truncate text-left">
              <span className="truncate">
                {selectedAllocation.student.fullname} - Room{" "}
                {selectedAllocation.bed.room.roomNumber}, Bed{" "}
                {selectedAllocation.bed.bedNumber}
              </span>
              {!selectedAllocation.isActive && (
                <Badge variant="destructive" className="text-xs shrink-0">Deallocated</Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[450px] p-0 max-h-[600px] flex flex-col" align="start">
        <div className="flex flex-col h-full">
          {/* Search Input */}
          <div className="flex items-center border-b px-3 py-2 shrink-0">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, room, or bed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 shadow-none focus-visible:ring-offset-0 h-9 px-0"
              autoFocus
            />
            {searchQuery && (
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
          {loading && allocations.length === 0 ? (
            <div className="flex items-center justify-center py-8 flex-1">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">Loading allocations...</span>
            </div>
          ) : allocations.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
              <Search className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No allocations found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Start typing to search for allocations"}
              </p>
            </div>
          ) : (
            /* Allocation List */
            <>
              <ScrollArea className={allocations.length <= 5 ? "h-auto" : "h-[350px]"}>
                <div className="p-2">
                  {allocations.map((allocation) => (
                    <button
                      key={allocation.id}
                      onClick={() => handleSelect(allocation)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-md hover:bg-accent transition-colors text-left cursor-pointer",
                        value === allocation.id && "bg-accent"
                      )}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate text-sm">
                            {allocation.student.fullname}
                          </span>
                          {!allocation.isActive && (
                            <Badge variant="destructive" className="text-xs shrink-0">Deallocated</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            Room {allocation.bed.room.roomNumber}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Bed {allocation.bed.bedNumber}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>NPR {allocation.bed.pricePerDay}/day</span>
                          <span>•</span>
                          <span className="truncate">{allocation.student.email}</span>
                        </div>
                      </div>
                      {value === allocation.id && (
                        <div className="shrink-0 mt-1">
                          <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>

              {/* More Results Message */}
              {hasMore && (
                <div className="px-3 py-2 text-xs text-center text-muted-foreground bg-muted/30 border-t shrink-0">
                  Showing first 50 results. Refine your search to see more.
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

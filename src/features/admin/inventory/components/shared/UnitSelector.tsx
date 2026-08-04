"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search, Ruler } from "lucide-react";
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
import { UNIT_OPTIONS } from "../../constants/inventory-constants";

interface UnitSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function UnitSelector({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select unit...",
  className,
}: UnitSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter units based on search
  const filteredUnits = useMemo(() => {
    if (!searchQuery) return UNIT_OPTIONS;

    const query = searchQuery.toLowerCase();
    return UNIT_OPTIONS.filter(
      (unit) =>
        unit.label.toLowerCase().includes(query) ||
        unit.value.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const selectedUnit = UNIT_OPTIONS.find((unit) => unit.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedUnit ? (
            <span className="truncate">{selectedUnit.label}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search units..."
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <CommandList>
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Ruler className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">No units found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your search
                </p>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredUnits.map((unit) => (
                <CommandItem
                  key={unit.value}
                  value={unit.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className="flex items-center gap-2 py-2"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === unit.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1">{unit.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

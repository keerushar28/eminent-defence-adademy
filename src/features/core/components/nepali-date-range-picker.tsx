"use client";

import * as React from "react";
import { NepaliCalendar } from "@/features/core/components/nepali-calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/features/core/components/popover";
import { Button } from "@/features/core/components/button";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";

export interface NepaliDateRangePickerProps {
    value?: { from?: Date; to?: Date };
    onChange?: (range: { from?: Date; to?: Date }) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function NepaliDateRangePicker({
    value,
    onChange,
    placeholder = "Pick a date range",
    className,
    disabled = false,
}: NepaliDateRangePickerProps) {
    const [open, setOpen] = React.useState(false);

    const formatDate = (date: Date | undefined) => {
        if (!date) return null;
        return formatNepaliDateFromDate(date);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange?.({ from: undefined, to: undefined });
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value?.from && !value?.to && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                        {value?.from ? (
                            value?.to ? (
                                <>
                                    {formatDate(value.from)} - {formatDate(value.to)}
                                </>
                            ) : (
                                formatDate(value.from)
                            )
                        ) : (
                            placeholder
                        )}
                    </span>
                    {(value?.from || value?.to) && (
                        <X
                            className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                            onClick={handleClear}
                        />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <NepaliCalendar
                    mode="range"
                    selected={value}
                    onSelect={(range) => {
                        onChange?.(range);
                        // Close popover when range is complete
                        if (range?.from && range?.to) {
                            setOpen(false);
                        }
                    }}
                    captionLayout="dropdown"
                />
            </PopoverContent>
        </Popover>
    );
}

"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import NepaliDate from "nepali-date-converter";

import { cn } from "@/lib/utils";
import { Button } from "@/features/core/components/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/features/core/components/popover";
import { NepaliCalendar } from "./nepali-calendar";

interface NepaliDatePickerProps {
    value?: Date | { from?: Date; to?: Date };
    onChange?: (date: Date | { from?: Date; to?: Date }) => void;
    mode?: "single" | "range";
    placeholder?: string;
    className?: string;
    captionLayout?: "dropdown" | "buttons";
}

export function NepaliDatePicker({
    value,
    onChange,
    mode = "single",
    placeholder = "Pick a date",
    className,
    captionLayout = "dropdown",
}: NepaliDatePickerProps) {
    const [open, setOpen] = React.useState(false);

    const formatNepaliDate = (date: Date) => {
        try {
            const nd = new NepaliDate(date);
            return nd.format("YYYY MMMM DD");
        } catch  {
            return "";
        }
    };

    const displayValue = React.useMemo(() => {
        if (mode === "single") {
            return value ? formatNepaliDate(value as Date) : placeholder;
        } else {
            const range = value as { from?: Date; to?: Date };
            if (range?.from) {
                if (range.to) {
                    return `${formatNepaliDate(range.from)} - ${formatNepaliDate(range.to)}`;
                }
                return formatNepaliDate(range.from);
            }
            return placeholder;
        }
    }, [value, mode, placeholder]);

    const handleSelect = (date: Date | { from?: Date; to?: Date }) => {
        onChange?.(date);
        if (mode === "single") {
            setOpen(false);
        } else if (mode === "range") {
            // Auto-close when both dates are selected
            if (date?.from && date?.to) {
                setOpen(false);
            }
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {displayValue}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <NepaliCalendar
                    mode={mode}
                    selected={value}
                    onSelect={handleSelect}
                    initialDate={
                        mode === "single"
                            ? (value as Date)
                            : (value as { from?: Date })?.from
                    }
                    captionLayout={captionLayout}
                />
            </PopoverContent>
        </Popover>
    );
}

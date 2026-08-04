"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import NepaliDate from "nepali-date-converter";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/features/core/components/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/features/core/components/select";

export type NepaliCalendarProps = {
    className?: string;
    mode?: "single" | "range";
    selected?: Date | { from?: Date; to?: Date } | undefined;
    onSelect?: (date: Date | { from?: Date; to?: Date }) => void; // Using any to support Date or Range
    initialDate?: Date;
    captionLayout?: "dropdown" | "buttons";
};

const NEPALI_MONTHS = [
    "Baisakh",
    "Jestha",
    "Ashadh",
    "Shrawan",
    "Bhadra",
    "Ashwin",
    "Kartik",
    "Mangsir",
    "Poush",
    "Magh",
    "Falgun",
    "Chaitra",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getDaysInMonth(year: number, month: number): number {
    // Simple check from 29 to 32
    for (let d = 32; d >= 29; d--) {
        const date = new NepaliDate(year, month, d);
        if (date.getMonth() === month) {
            return d;
        }
    }
    return 30; // Fallback
}

export function NepaliCalendar({
    className,
    mode = "single",
    selected,
    onSelect,
    initialDate,
    captionLayout,
}: NepaliCalendarProps) {
    // State for the currently viewed month
    const [viewDate, setViewDate] = React.useState(() => {
        const start = initialDate || new Date();
        return new NepaliDate(start);
    });

    const currentYear = viewDate.getYear();
    const currentMonth = viewDate.getMonth();

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = new NepaliDate(currentYear, currentMonth, 1).getDay(); // 0-6

    const handlePrevMonth = () => {
        let newMonth = currentMonth - 1;
        let newYear = currentYear;
        if (newMonth < 0) {
            newMonth = 11;
            newYear -= 1;
        }
        setViewDate(new NepaliDate(newYear, newMonth, 1));
    };

    const handleNextMonth = () => {
        let newMonth = currentMonth + 1;
        let newYear = currentYear;
        if (newMonth > 11) {
            newMonth = 0;
            newYear += 1;
        }
        setViewDate(new NepaliDate(newYear, newMonth, 1));
    };

    const handleMonthChange = (month: string) => {
        const newMonth = parseInt(month);
        setViewDate(new NepaliDate(currentYear, newMonth, 1));
    };

    const handleYearChange = (year: string) => {
        const newYear = parseInt(year);
        setViewDate(new NepaliDate(newYear, currentMonth, 1));
    };

    // Generate years range (e.g., 2000 to 2099 BS)
    const years = React.useMemo(() => {
        const startYear = 2000;
        const endYear = 2099;
        return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
    }, []);

    const handleDateClick = (day: number) => {
        const clickedDateBS = new NepaliDate(currentYear, currentMonth, day);
        const clickedDateAD = clickedDateBS.toJsDate();

        // Validate that the conversion was successful
        if (!clickedDateAD || isNaN(clickedDateAD.getTime())) {
            console.error("Failed to convert Nepali date to AD date");
            return;
        }

        if (mode === "single") {
            onSelect?.(clickedDateAD);
        } else if (mode === "range") {
            const currentRange = (selected as { from?: Date; to?: Date }) || {};

            if (!currentRange.from || (currentRange.from && currentRange.to)) {
                // Start new range
                onSelect?.({ from: clickedDateAD, to: undefined });
            } else {
                // Complete range
                let from = currentRange.from;
                let to = clickedDateAD;
                if (to < from) {
                    const temp = from;
                    from = to;
                    to = temp;
                }
                onSelect?.({ from, to });
            }
        }
    };

    const isSelected = (day: number) => {
        const dateBS = new NepaliDate(currentYear, currentMonth, day);
        const dateAD = dateBS.toJsDate();
        const dateStr = dateAD.toDateString();

        if (mode === "single") {
            return (selected as Date)?.toDateString() === dateStr;
        } else if (mode === "range") {
            const range = selected as { from?: Date; to?: Date };
            if (!range?.from) return false;
            if (range.to) {
                return dateAD >= range.from && dateAD <= range.to;
            }
            return range.from.toDateString() === dateStr;
        }
        return false;
    };

    const isRangeStart = (day: number) => {
        if (mode !== "range") return false;
        const range = selected as { from?: Date; to?: Date };
        if (!range?.from) return false;
        const dateBS = new NepaliDate(currentYear, currentMonth, day);
        return dateBS.toJsDate().toDateString() === range.from.toDateString();
    }

    const isRangeEnd = (day: number) => {
        if (mode !== "range") return false;
        const range = selected as { from?: Date; to?: Date };
        if (!range?.to) return false;
        const dateBS = new NepaliDate(currentYear, currentMonth, day);
        return dateBS.toJsDate().toDateString() === range.to.toDateString();
    }

    const isRangeMiddle = (day: number) => {
        if (mode !== "range") return false;
        const range = selected as { from?: Date; to?: Date };
        if (!range?.from || !range?.to) return false;
        const dateAD = new NepaliDate(currentYear, currentMonth, day).toJsDate();
        return dateAD > range.from && dateAD < range.to;
    }

    return (
        <div className={cn("p-3", className)}>
            <div className="flex justify-center pt-1 relative items-center">
                {captionLayout === "dropdown" ? (
                    <div className="flex gap-1 items-center z-10">
                        <Select
                            value={currentMonth.toString()}
                            onValueChange={handleMonthChange}
                        >
                            <SelectTrigger className="h-7 w-[90px] border-none shadow-none font-medium p-1 focus:ring-0">
                                <SelectValue>{NEPALI_MONTHS[currentMonth]}</SelectValue>
                            </SelectTrigger>
                            <SelectContent position="popper" className="max-h-[200px]">
                                {NEPALI_MONTHS.map((month, index) => (
                                    <SelectItem key={month} value={index.toString()}>
                                        {month}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={currentYear.toString()}
                            onValueChange={handleYearChange}
                        >
                            <SelectTrigger className="h-7 w-[70px] border-none shadow-none font-medium p-1 focus:ring-0">
                                <SelectValue>{currentYear}</SelectValue>
                            </SelectTrigger>
                            <SelectContent position="popper" className="max-h-[200px]">
                                {years.map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : (
                    <div className="text-sm font-medium">
                        {NEPALI_MONTHS[currentMonth]} {currentYear}
                    </div>
                )}
                <div className="space-x-1 flex items-center absolute left-1">
                    <button
                        onClick={handlePrevMonth}
                        className={cn(
                            buttonVariants({ variant: "outline" }),
                            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                        )}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                </div>
                <div className="space-x-1 flex items-center absolute right-1">
                    <button
                        onClick={handleNextMonth}
                        className={cn(
                            buttonVariants({ variant: "outline" }),
                            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                        )}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
            <div className="flex mt-4 w-full">
                {/* Grid */}
                <div className="w-full border-collapse space-y-1">
                    <div className="flex">
                        {WEEKDAYS.map((day) => (
                            <div
                                key={day}
                                className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] flex justify-center items-center"
                            >
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-y-1">
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const selected = isSelected(day);
                            const rangeStart = isRangeStart(day);
                            const rangeEnd = isRangeEnd(day);
                            const rangeMiddle = isRangeMiddle(day);

                            return (
                                <div key={day} className={cn("relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                                    rangeMiddle && "bg-accent first:rounded-l-md last:rounded-r-md"
                                )}>
                                    <button
                                        onClick={() => handleDateClick(day)}
                                        className={cn(
                                            buttonVariants({ variant: "ghost" }),
                                            "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                                            (rangeStart || rangeEnd || (selected && mode === "single")) &&
                                            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                            rangeMiddle && "bg-accent text-accent-foreground rounded-none",
                                            rangeStart && "rounded-l-md rounded-r-none",
                                            rangeEnd && "rounded-r-md rounded-l-none",
                                        )}
                                    >
                                        {day}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

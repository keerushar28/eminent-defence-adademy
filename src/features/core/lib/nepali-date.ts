"use client";

// Nepali date conversion utilities using nepali-date-converter package
import NepaliDateConverter from "nepali-date-converter";

export const NEPALI_MONTHS_EN = [
  "Baishakh",
  "Jyeshtha",
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

export interface NepaliDate {
  year: number;
  month: number;
  day: number;
}

/**
 * Convert AD (Gregorian) date to BS (Bikram Sambat/Nepali) date
 */
export function adToBS(date: Date): NepaliDate {
  const nepaliDate = new NepaliDateConverter(date);
  const parts = nepaliDate.format("YYYY-MM-DD").split("-");
  return {
    year: parseInt(parts[0]),
    month: parseInt(parts[1]),
    day: parseInt(parts[2]),
  };
}

/**
 * Convert BS (Bikram Sambat/Nepali) date to AD (Gregorian) date
 */
export function bsToAD(year: number, month: number, day: number): Date {
  const nepaliDate = new NepaliDateConverter(year, month - 1, day);
  return nepaliDate.toJsDate();
}

/**
 * Format a Nepali date to a readable string
 */
export function formatNepaliDate(
  year: number,
  month: number,
  day: number,
  locale: "en" | "ne" = "en"
): string {
  const monthName = NEPALI_MONTHS_EN[month - 1];
  return `${day} ${monthName} ${year}`;
}

/**
 * Format an AD (English) date to Nepali date string
 * Converts AD date to BS and returns formatted string
 */
export function formatNepaliDateFromDate(
  date: Date,
  locale: "en" | "ne" = "en"
): string {
  // Convert AD date to BS
  const bs = adToBS(date);
  return formatNepaliDate(bs.year, bs.month, bs.day, locale);
}

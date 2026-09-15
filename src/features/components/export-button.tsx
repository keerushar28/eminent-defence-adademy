"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowDownToLine,
  ChevronDown,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import {
  exportToExcel,
  exportToPDF,
  type ExportOptions,
} from "@/lib/export-utils";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────

interface ExportButtonProps {
  options: ExportOptions;
  disabled?: boolean;
  variant?: "default" | "outline";
  size?: "sm" | "md";
}

// ── Component ─────────────────────────────────────────────────────

export function ExportButton({
  options,
  disabled = false,
  variant = "outline",
  size = "sm",
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleExport = async (type: "excel" | "pdf") => {
    setIsOpen(false);
    setIsExporting(true);

    try {
      if (type === "excel") {
        await exportToExcel(options);
        toast.success("Excel file downloaded successfully");
      } else {
        await exportToPDF(options);
        toast.success("PDF file downloaded successfully");
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(`Failed to export ${type.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Button styling based on variant and size
  const buttonClasses = {
    default: "bg-teal-700 hover:bg-teal-800 text-white border-teal-700",
    outline:
      "bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-teal-500",
  };

  const sizeClasses = {
    sm: "h-8 px-3 text-sm",
    md: "h-9 px-4 text-sm",
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting}
        className={`inline-flex items-center gap-1.5 font-medium border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonClasses[variant]} ${sizeClasses[size]}`}
      >
        <ArrowDownToLine className="size-3.5" />
        <span className="hidden sm:inline">
          {isExporting ? "Exporting..." : "Export"}
        </span>
        <ChevronDown
          className={`size-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          <button
            onClick={() => handleExport("excel")}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <FileSpreadsheet className="size-4 text-green-600" />
            <div className="flex flex-col">
              <span className="font-medium">Export to Excel</span>
              <span className="text-xs text-gray-500">.xlsx format</span>
            </div>
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
          >
            <FileText className="size-4 text-red-600" />
            <div className="flex flex-col">
              <span className="font-medium">Export to PDF</span>
              <span className="text-xs text-gray-500">.pdf format</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

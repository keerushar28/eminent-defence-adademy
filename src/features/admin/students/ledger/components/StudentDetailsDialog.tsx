"use client";

import { useState, useMemo } from "react";
import { LedgerStudent } from "../actions/ledger-actions";
import { Badge } from "@/features/core/components/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/features/core/components/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/features/core/components/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/core/components/table";
import { format } from "date-fns";
import { CreditCard, Search, X, Filter, Download, FileText } from "lucide-react";
import { Input } from "@/features/core/components/input";
import { Button } from "@/features/core/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/core/components/select";
import { NepaliDateRangePicker } from "@/features/core/components/nepali-date-range-picker";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import Pagination from "@/features/core/components/shared/pagination";
import { useDebounce } from "@/features/core/hooks/useDebounce";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/features/core/components/dropdown-menu";

interface StudentDetailsDialogProps {
  student: LedgerStudent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StudentDetailsDialog({
  student,
  open,
  onOpenChange,
}: StudentDetailsDialogProps) {
  // Pagination and filtering state - must be before early return
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const debouncedSearch = useDebounce(searchInput, 500);

  // Filter and paginate payments - must be before early return
  const filteredPayments = useMemo(() => {
    if (!student) return [];
    return student.payments.filter((payment) => {
      const matchesSearch = debouncedSearch === "" ||
        payment.categoryName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        payment.subCategoryName.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesMethod = selectedPaymentMethod === "ALL" || payment.paymentMethod === selectedPaymentMethod;

      const paymentDate = new Date(payment.paymentDate);
      const matchesDateRange =
        (!dateRange.from || paymentDate >= dateRange.from) &&
        (!dateRange.to || paymentDate <= dateRange.to);

      return matchesSearch && matchesMethod && matchesDateRange;
    });
  }, [student, debouncedSearch, selectedPaymentMethod, dateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / pageSize);
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPayments.slice(startIndex, startIndex + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  // Get unique payment methods
  const paymentMethods = useMemo(() => {
    if (!student) return [];
    return Array.from(new Set(student.payments.map(p => p.paymentMethod)));
  }, [student]);

  const hasActiveFilters = debouncedSearch !== "" || selectedPaymentMethod !== "ALL" || dateRange.from || dateRange.to;

  const clearFilters = () => {
    setSearchInput("");
    setSelectedPaymentMethod("ALL");
    setDateRange({ from: undefined, to: undefined });
    setCurrentPage(1);
  };

  // Early return after all hooks
  if (!student) return null;

  const formatCurrency = (amount: number) => {
    return `NPR ${amount.toLocaleString("en-NP", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "CASH":
        return "bg-green-100 text-green-800 border-green-200";
      case "ONLINE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "BANK_TRANSFER":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "CHEQUE":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "CARD":
        return "bg-pink-100 text-pink-800 border-pink-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="h-10/12 min-w-6xl overflow-y-auto max-w-7xl">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Avatar className="h-12 w-12 border-2 border-slate-200 shrink-0">
                <AvatarImage src={student.student_image} alt={student.fullname} />
                <AvatarFallback className="bg-slate-200 text-slate-700 font-semibold text-sm">
                  {student.fullname.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold text-slate-900">{student.fullname}</DialogTitle>
                <p className="text-xs text-slate-500 mt-0.5">{student.email}</p>
                <div className="mt-1.5">
                  {student.status === "FULLY_PAID" && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border text-xs font-medium">Fully Paid</Badge>
                  )}
                  {student.status === "PENDING" && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 border text-xs font-medium">Pending</Badge>
                  )}
                  {student.status === "UNPAID" && (
                    <Badge className="bg-rose-100 text-rose-700 border-rose-200 border text-xs font-medium">Unpaid</Badge>
                  )}
                  {student.status === "NO_ALLOCATION" && (
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200 border text-xs font-medium">No Allocation</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          {/* Financial Summary - Compact Grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs font-medium text-slate-600 mb-1">Total Fee</p>
              <p className="text-sm font-semibold text-slate-900">
                {formatCurrency(student.totalFee)}
              </p>
            </div>

            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <p className="text-xs font-medium text-emerald-700 mb-1">Total Paid</p>
              <p className="text-sm font-semibold text-emerald-700">
                {formatCurrency(student.totalPaid)}
              </p>
            </div>

            <div className="bg-rose-50 rounded-lg p-3 border border-rose-200">
              <p className="text-xs font-medium text-rose-700 mb-1">Pending</p>
              <p className="text-sm font-semibold text-rose-700">
                {formatCurrency(student.pendingAmount)}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs font-medium text-blue-700 mb-1">Discount</p>
              <p className="text-sm font-semibold text-blue-700">
                {formatCurrency(student.totalDiscount)}
              </p>
            </div>
          </div>

          {/* Categories Breakdown */}
          {student.categories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Categories ({student.categories.length})</h3>
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 border-b border-slate-200">
                      <TableHead className="text-xs font-semibold text-slate-700 h-8">Category</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 h-8">Subcategory</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 h-8">Assigned Date</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 h-8 text-right">Fee</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 h-8 text-right">Paid</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 h-8 text-right">Pending</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 h-8 text-center">Progress</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 h-8 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.categories.map((cat, idx) => {
                      const progress = cat.fee > 0 ? (cat.paid / cat.fee) * 100 : 0;
                      const assignedDate = new Date(cat.assignedDate);

                      return (
                        <TableRow key={idx} className={`border-b border-slate-100 hover:bg-slate-50 ${!cat.isActive ? 'opacity-60' : ''}`}>
                          <TableCell className="text-xs font-medium text-slate-900 py-2">{cat.categoryName}</TableCell>
                          <TableCell className="text-xs text-slate-600 py-2">{cat.subCategoryName}</TableCell>
                          <TableCell className="text-xs text-slate-600 py-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-slate-900">{formatNepaliDateFromDate(assignedDate)}</span>
                              <span className="text-slate-400 text-xs">{formatNepaliDateFromDate(assignedDate)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-medium text-slate-900 text-right py-2">
                            {formatCurrency(cat.fee)}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-emerald-700 text-right py-2">
                            {formatCurrency(cat.paid)}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-rose-700 text-right py-2">
                            {formatCurrency(cat.pending)}
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${progress === 100
                                    ? "bg-emerald-500"
                                    : progress > 0
                                      ? "bg-amber-500"
                                      : "bg-slate-300"
                                    }`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-slate-600 w-8 text-right">
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            {cat.isActive ? (
                              <Badge variant="outline" className="text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
                                Active
                              </Badge>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                <Badge variant="outline" className="text-xs font-medium bg-slate-100 text-slate-700 border-slate-200">
                                  Inactive
                                </Badge>
                                {cat.checkedOutAt && (
                                  <span className="text-xs text-slate-500">{formatNepaliDateFromDate(new Date(cat.checkedOutAt))}</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Payment History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Payment History ({filteredPayments.length})
              </h3>
            </div>

            {/* Filters */}
            {student.payments.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-2.5 mb-3 border border-slate-200 space-y-2">
                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  {/* Search */}
                  <div className="relative flex-1 min-w-0 md:max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search..."
                      value={searchInput}
                      onChange={(e) => {
                        setSearchInput(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>

                  {/* Payment Method Filter */}
                  <Select value={selectedPaymentMethod} onValueChange={(value) => {
                    setSelectedPaymentMethod(value)
                    setCurrentPage(1)
                  }}>
                    <SelectTrigger className="h-8 text-sm w-full md:w-max">
                      <SelectValue placeholder="All Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL" className="text-sm">All Methods</SelectItem>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Date Range Filter */}
                  <NepaliDateRangePicker
                    value={dateRange}
                    onChange={(range) => {
                      setDateRange({
                        from: range?.from,
                        to: range?.to,
                      })
                      setCurrentPage(1)
                    }}
                    placeholder="Date range"
                    className="w-full md:w-max"
                  />

                  {/* Clear Filters Button */}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 px-2 text-xs"
                    >
                      Clear
                      <X className="ml-1.5 h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {student.payments.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                <CreditCard className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-600 font-medium">No payments recorded</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                <Filter className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-600 font-medium">No payments match filters</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 border-b border-slate-200">
                        <TableHead className="text-xs font-semibold text-slate-700 h-8">Date</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-700 h-8">Category</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-700 h-8 text-right">Amount</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-700 h-8">Method</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-700 h-8">Reference</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-700 h-8">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPayments.map((payment) => (
                        <TableRow key={payment.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <TableCell className="text-xs text-slate-600 py-2">
                            {formatNepaliDateFromDate(new Date(payment.paymentDate))}
                          </TableCell>
                          <TableCell className="text-xs py-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-slate-900">{payment.categoryName}</span>
                              <span className="text-slate-500">{payment.subCategoryName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-emerald-700 text-right py-2">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell className="text-xs py-2">
                            <Badge
                              variant="outline"
                              className={`text-xs font-medium ${getPaymentMethodColor(payment.paymentMethod)}`}
                            >
                              {payment.paymentMethod.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 py-2 font-mono">
                            {payment.referenceNumber || "-"}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 py-2">
                            {payment.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-3">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredPayments.length}
                      itemsPerPage={pageSize}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={(newSize) => {
                        setPageSize(newSize)
                        setCurrentPage(1)
                      }}
                      loading={false}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

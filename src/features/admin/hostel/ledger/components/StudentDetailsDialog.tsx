"use client";

import { HostelLedgerStudent } from "../types";
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
import { CreditCard, Search, X, Filter } from "lucide-react";
import { Input } from "@/features/core/components/input";
import { Button } from "@/features/core/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/core/components/select";
import { formatCurrency } from "../utils/utils";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import { useState, useMemo } from "react";
import { useDebounce } from "@/features/core/hooks/useDebounce";
import Pagination from "@/features/core/components/shared/pagination";

interface StudentDetailsDialogProps {
  student: HostelLedgerStudent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StudentDetailsDialog({
  student,
  open,
  onOpenChange,
}: StudentDetailsDialogProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("ALL");

  const debouncedSearch = useDebounce(searchInput, 500);

  // Filter payments
  const filteredPayments = useMemo(() => {
    if (!student) return [];
    return student.payments.filter((payment) => {
      const matchesSearch = debouncedSearch === "" ||
        payment.paymentMethod.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesMethod = selectedPaymentMethod === "ALL" || payment.paymentMethod === selectedPaymentMethod;

      return matchesSearch && matchesMethod;
    });
  }, [student, debouncedSearch, selectedPaymentMethod]);

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

  // Early return after hooks if no student
  if (!student) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="h-10/12 min-w-6xl overflow-y-auto max-w-7xl">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-lg font-semibold">No Student Selected</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const hasActiveFilters = debouncedSearch !== "" || selectedPaymentMethod !== "ALL";

  const clearFilters = () => {
    setSearchInput("");
    setSelectedPaymentMethod("ALL");
    setCurrentPage(1);
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "CASH":
        return "bg-primary/10 text-primary border-primary/20";
      case "ONLINE":
        return "bg-primary/10 text-primary border-primary/20";
      case "BANK_TRANSFER":
        return "bg-accent text-accent-foreground border";
      case "CHEQUE":
        return "bg-accent text-accent-foreground border";
      case "CARD":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground border";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-10/12 min-w-6xl overflow-y-auto max-w-7xl">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Avatar className="h-12 w-12 border-2 shrink-0">
                <AvatarImage src={student.student_image} alt={student.fullname} />
                <AvatarFallback className="bg-muted font-semibold text-sm">
                  {student.fullname.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold">{student.fullname}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{student.email}</p>
                <div className="mt-1.5">
                  {student.status === "FULLY_PAID" && (
                    <Badge className="bg-primary/10 text-primary border text-xs font-medium">Fully Paid</Badge>
                  )}
                  {student.status === "PARTIAL" && (
                    <Badge className="bg-accent text-accent-foreground border text-xs font-medium">Partial Payment</Badge>
                  )}
                  {student.status === "PENDING" && (
                    <Badge className="bg-destructive/10 text-destructive border text-xs font-medium">Pending</Badge>
                  )}
                  {student.status === "OVERPAID" && (
                    <Badge className="bg-primary/20 text-primary border text-xs font-medium">Overpaid</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          {/* Financial Summary - Compact Grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-card rounded-lg p-3 border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Price Per Day</p>
              <p className="text-sm font-semibold">
                {formatCurrency(student.pricePerDay)}
              </p>
            </div>

            <div className="bg-card rounded-lg p-3 border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Total Paid</p>
              <p className="text-sm font-semibold text-primary">
                {formatCurrency(student.totalPaid)}
              </p>
            </div>

            <div className="bg-card rounded-lg p-3 border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Pending</p>
              <p className="text-sm font-semibold text-destructive">
                {formatCurrency(student.pendingAmount)}
              </p>
            </div>

            <div className="bg-card rounded-lg p-3 border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Overpaid</p>
              <p className="text-sm font-semibold text-primary">
                {formatCurrency(student.overpaidAmount)}
              </p>
            </div>
          </div>

          {/* Allocation Details */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Allocation Details</h3>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted border-b">
                    <TableHead className="text-xs font-semibold h-8">Room</TableHead>
                    <TableHead className="text-xs font-semibold h-8">Bed</TableHead>
                    <TableHead className="text-xs font-semibold h-8">Allocation Date</TableHead>
                    <TableHead className="text-xs font-semibold h-8">Paid Until</TableHead>
                    <TableHead className="text-xs font-semibold h-8 text-right">Total Days</TableHead>
                    <TableHead className="text-xs font-semibold h-8 text-right">Days Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-b hover:bg-muted/50">
                    <TableCell className="text-xs font-medium py-2">{student.roomNumber}</TableCell>
                    <TableCell className="text-xs text-muted-foreground py-2">{student.bedNumber}</TableCell>
                    <TableCell className="text-xs text-muted-foreground py-2">
                      {formatNepaliDateFromDate(new Date(student.allocationDate))}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground py-2">
                      {formatNepaliDateFromDate(new Date(student.paidUntil))}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-right py-2">
                      {student.totalDays}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-primary text-right py-2">
                      {student.daysPaid}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Payment History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">
                Payment History ({filteredPayments.length})
              </h3>
            </div>

            {/* Filters */}
            {student.payments.length > 0 && (
              <div className="bg-muted rounded-lg p-2.5 mb-3 border space-y-2">
                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  {/* Search */}
                  <div className="relative flex-1 min-w-0 md:max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
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
                    <SelectTrigger className="h-8 text-xs w-full md:w-max">
                      <SelectValue placeholder="All Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Methods</SelectItem>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

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
              <div className="text-center py-8 bg-muted rounded-lg border">
                <CreditCard className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground font-medium">No payments recorded</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8 bg-muted rounded-lg border">
                <Filter className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground font-medium">No payments match filters</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted border-b">
                        <TableHead className="text-xs font-semibold h-8">Date</TableHead>
                        <TableHead className="text-xs font-semibold h-8 text-right">Amount</TableHead>
                        <TableHead className="text-xs font-semibold h-8 text-right">Days</TableHead>
                        <TableHead className="text-xs font-semibold h-8">Paid Until</TableHead>
                        <TableHead className="text-xs font-semibold h-8">Method</TableHead>
                        <TableHead className="text-xs font-semibold h-8">Reference</TableHead>
                        <TableHead className="text-xs font-semibold h-8">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPayments.map((payment) => (
                        <TableRow key={payment.id} className="border-b hover:bg-muted/50">
                          <TableCell className="text-xs text-muted-foreground py-2">
                            {formatNepaliDateFromDate(new Date(payment.paymentDate))}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-primary text-right py-2">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-right py-2">
                            {payment.daysPurchased}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground py-2">
                            {formatNepaliDateFromDate(new Date(payment.updatedPaidUntil))}
                          </TableCell>
                          <TableCell className="text-xs py-2">
                            <Badge
                              variant="outline"
                              className={`text-xs font-medium ${getPaymentMethodColor(payment.paymentMethod)}`}
                            >
                              {payment.paymentMethod.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground py-2 font-mono">
                            {payment.referenceNumber || "-"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground py-2">
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

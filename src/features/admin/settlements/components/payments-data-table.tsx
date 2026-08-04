"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/features/core/components/badge";
import { Button } from "@/features/core/components/button";
import { Checkbox } from "@/features/core/components/checkbox";
import { Input } from "@/features/core/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/core/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/core/components/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/core/components/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/features/core/components/dialog";
import { Label } from "@/features/core/components/label";
import { Textarea } from "@/features/core/components/textarea";
import { CheckCircle, Clock, Search, Filter, ArrowUpDown, Settings, MoreHorizontal, Edit, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/features/core/components/dropdown-menu";
import { toast } from "sonner";
import Pagination from "@/features/core/components/shared/pagination";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import type { PaymentWithDetails, GetPaymentsParams } from "../types";
import { createSettlement } from "../actions/settlement-actions";
import { PaymentSettlementDialog } from "./payment-settlement-dialog";

interface PaymentsDataTableProps {
  initialPayments: PaymentWithDetails[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  onParamsChange: (params: GetPaymentsParams) => void;
  isLoading?: boolean;
}

export function PaymentsDataTable({
  initialPayments,
  totalCount,
  totalPages,
  currentPage,
  pageSize,
  onParamsChange,
  isLoading = false,
}: PaymentsDataTableProps) {
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [settlementFilter, setSettlementFilter] = useState<string>("ALL");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState("paymentDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isSettlementDialogOpen, setIsSettlementDialogOpen] = useState(false);
  const [selectedPaymentForDialog, setSelectedPaymentForDialog] = useState<PaymentWithDetails | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [settlementForm, setSettlementForm] = useState({
    paymentMethod: "CASH",
    referenceNumber: "",
    notes: "",
  });
  const [isPending, startTransition] = useTransition();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    const nepaliDate = formatNepaliDateFromDate(new Date(date));
    const englishTime = new Intl.DateTimeFormat("en-NP", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
    
    return (
      <div className="text-sm">
        <div className="font-medium">{nepaliDate}</div>
        <div className="text-muted-foreground text-xs">{englishTime}</div>
      </div>
    );
  };

  const handleSearch = () => {
    onParamsChange({
      page: 1,
      pageSize,
      search: searchTerm,
      type: typeFilter as any,
      isSettled: settlementFilter === "ALL" ? undefined : settlementFilter === "SETTLED",
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      sortBy,
      sortOrder,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("ALL");
    setSettlementFilter("ALL");
    setDateFromFilter("");
    setDateToFilter("");
    setSortBy("paymentDate");
    setSortOrder("desc");
    onParamsChange({
      page: 1,
      pageSize,
      sortBy: "paymentDate",
      sortOrder: "desc",
    });
  };

  const handleSort = (column: string) => {
    const newSortOrder = sortBy === column && sortOrder === "desc" ? "asc" : "desc";
    setSortBy(column);
    setSortOrder(newSortOrder);
    onParamsChange({
      page: currentPage,
      pageSize,
      search: searchTerm,
      type: typeFilter as any,
      isSettled: settlementFilter === "ALL" ? undefined : settlementFilter === "SETTLED",
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      sortBy: column,
      sortOrder: newSortOrder,
    });
  };

  const handlePageChange = (page: number) => {
    onParamsChange({
      page,
      pageSize,
      search: searchTerm,
      type: typeFilter as any,
      isSettled: settlementFilter === "ALL" ? undefined : settlementFilter === "SETTLED",
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      sortBy,
      sortOrder,
    });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    onParamsChange({
      page: 1,
      pageSize: newPageSize,
      search: searchTerm,
      type: typeFilter as any,
      isSettled: settlementFilter === "ALL" ? undefined : settlementFilter === "SETTLED",
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      sortBy,
      sortOrder,
    });
  };

  const handleSelectPayment = (paymentId: string, checked: boolean) => {
    if (checked) {
      setSelectedPayments(prev => [...prev, paymentId]);
    } else {
      setSelectedPayments(prev => prev.filter(id => id !== paymentId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const unsettledPayments = initialPayments
        .filter(p => !p.isSettled)
        .map(p => p.id);
      setSelectedPayments(unsettledPayments);
    } else {
      setSelectedPayments([]);
    }
  };

  const handleCreateSettlement = () => {
    if (selectedPayments.length === 0) {
      toast.error("Please select at least one payment to settle");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createSettlement({
          paymentIds: selectedPayments,
          notes: settlementForm.notes || undefined,
        });

        if (result.success) {
          toast.success(`Payments approved successfully for ${selectedPayments.length} payments`);
          setSelectedPayments([]);
          setIsSettlementDialogOpen(false);
          setSettlementForm({
            paymentMethod: "CASH",
            referenceNumber: "",
            notes: "",
          });
          // Refresh the data
          handleSearch();
        } else {
          toast.error(result.error || "Failed to approve payments");
        }
      } catch (error) {
        toast.error("An error occurred while approving payments");
      }
    });
  };

  const handleOpenPaymentDialog = (payment: PaymentWithDetails) => {
    setSelectedPaymentForDialog(payment);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentStatusUpdated = () => {
    // Refresh the data
    handleSearch();
  };

  const selectedAmount = initialPayments
    .filter(p => selectedPayments.includes(p.id))
    .reduce((sum, p) => sum + p.amount, 0);

  const unsettledPayments = initialPayments.filter(p => !p.isSettled);
  const allUnsettledSelected = unsettledPayments.length > 0 && 
    unsettledPayments.every(p => selectedPayments.includes(p.id));

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case "CATEGORY":
        return "bg-blue-100 text-blue-800";
      case "HOSTEL":
        return "bg-green-100 text-green-800";
      case "ISSUANCE":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentDetails = (payment: PaymentWithDetails) => {
    switch (payment.type) {
      case "CATEGORY":
        return {
          student: payment.studentCategory?.student.fullname || "N/A",
          detail: `${payment.studentCategory?.subCategory.category.name} - ${payment.studentCategory?.subCategory.name}`,
        };
      case "HOSTEL":
        return {
          student: payment.hostelAllocation?.student.fullname || "N/A",
          detail: `Room ${payment.hostelAllocation?.bed.room.roomNumber} - Bed ${payment.hostelAllocation?.bed.bedNumber}`,
        };
      case "ISSUANCE":
        return {
          student: payment.issuance?.student.fullname || "N/A",
          detail: `${payment.issuance?.item.category.name} - ${payment.issuance?.item.name}`,
        };
      default:
        return { student: "N/A", detail: "N/A" };
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payment Approvals</CardTitle>
            <CardDescription>
              Review and approve payments across all categories
            </CardDescription>
          </div>
          {selectedPayments.length > 0 && (
            <Dialog open={isSettlementDialogOpen} onOpenChange={setIsSettlementDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Settings className="mr-2 h-4 w-4" />
                  Approve {selectedPayments.length} Payment{selectedPayments.length > 1 ? "s" : ""}
                  ({formatCurrency(selectedAmount)})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve Payments</DialogTitle>
                  <DialogDescription>
                    Approve {selectedPayments.length} selected payment{selectedPayments.length > 1 ? "s" : ""} 
                    totaling {formatCurrency(selectedAmount)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="notes">Approval Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={settlementForm.notes}
                      onChange={(e) => 
                        setSettlementForm(prev => ({ ...prev, notes: e.target.value }))
                      }
                      placeholder="Enter any notes about this approval"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsSettlementDialogOpen(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSettlement} disabled={isPending}>
                    {isPending ? "Processing..." : "Approve Payments"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by student name, email, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSearch} variant="outline" disabled={isLoading}>
                <Filter className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} 
                variant="outline"
                disabled={isLoading}
              >
                Advanced
              </Button>
              <Button onClick={handleClearFilters} variant="outline" disabled={isLoading}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter} disabled={isLoading}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Payment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="CATEGORY">Category</SelectItem>
                <SelectItem value="HOSTEL">Hostel</SelectItem>
                <SelectItem value="ISSUANCE">Issuance</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={settlementFilter} onValueChange={setSettlementFilter} disabled={isLoading}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Settlement Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Payments</SelectItem>
                <SelectItem value="SETTLED">Approved</SelectItem>
                <SelectItem value="UNSETTLED">Pending Approval</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
              <h4 className="font-medium text-sm">Advanced Filters</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateFrom" className="text-sm">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    disabled={isLoading}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo" className="text-sm">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    disabled={isLoading}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSearch} size="sm" disabled={isLoading}>
                  Apply Filters
                </Button>
                <Button 
                  onClick={() => {
                    setDateFromFilter("");
                    setDateToFilter("");
                  }} 
                  variant="outline" 
                  size="sm"
                  disabled={isLoading}
                >
                  Clear Dates
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allUnsettledSelected}
                    onCheckedChange={handleSelectAll}
                    disabled={unsettledPayments.length === 0 || isLoading}
                  />
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("paymentDate")}
                    className="h-auto p-0 font-semibold"
                    disabled={isLoading}
                  >
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("amount")}
                    className="h-auto p-0 font-semibold"
                    disabled={isLoading}
                  >
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: pageSize }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                  </TableRow>
                ))
              ) : initialPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    No payments found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                initialPayments.map((payment, index) => {
                  const details = getPaymentDetails(payment);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="text-center font-medium text-sm">
                        {(currentPage - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={selectedPayments.includes(payment.id)}
                          onCheckedChange={(checked) => 
                            handleSelectPayment(payment.id, checked as boolean)
                          }
                          disabled={payment.isSettled || isLoading}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatDate(payment.paymentDate)}
                      </TableCell>
                      <TableCell>{details.student}</TableCell>
                      <TableCell>
                        <Badge className={getPaymentTypeColor(payment.type)}>
                          {payment.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={details.detail}>
                        {details.detail}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {payment.createdByUser?.username || 'Unknown User'}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {payment.createdByUser?.email || 'No email'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.isSettled && payment.approvedBy ? (
                          <div className="text-sm">
                            <div className="font-medium text-green-700">
                              {payment.approvedBy.username}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {payment.approvedBy.email}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            -
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {payment.isSettled ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-800">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenPaymentDialog(payment)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {payment.isSettled ? "Manage Approval" : "Approve Payment"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={pageSize}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handlePageSizeChange}
          loading={isLoading}
        />
      </CardContent>

      {/* Payment Settlement Dialog */}
      {selectedPaymentForDialog && (
        <PaymentSettlementDialog
          payment={selectedPaymentForDialog}
          isOpen={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          onStatusUpdated={handlePaymentStatusUpdated}
        />
      )}
    </Card>
  );
}
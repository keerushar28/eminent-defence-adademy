"use client";

import { useState } from "react";
import { Badge } from "@/features/core/components/badge";
import { Button } from "@/features/core/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/core/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/core/components/table";
import { ArrowUpDown, FileText, Calendar, Wallet } from "lucide-react";
import type { Settlement } from "../types";

interface SettlementsHistoryProps {
  initialSettlements: Settlement[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function SettlementsHistory({
  initialSettlements,
  totalCount,
  totalPages,
  currentPage,
  pageSize,
  onPageChange,
}: SettlementsHistoryProps) {
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-NP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const handleSort = (column: string) => {
    const newSortOrder = sortBy === column && sortOrder === "desc" ? "asc" : "desc";
    setSortBy(column);
    setSortOrder(newSortOrder);
    // TODO: Implement sorting on server side
  };

  const getTotalPaymentsCount = (settlement: Settlement) => {
    return settlement.categoryPaymentsCount +
      settlement.hostelPaymentsCount +
      settlement.issuancePaymentsCount;
  };

  const getPaymentBreakdown = (settlement: Settlement) => {
    const breakdown = [];
    if (settlement.categoryPaymentsCount > 0) {
      breakdown.push(`${settlement.categoryPaymentsCount} Category`);
    }
    if (settlement.hostelPaymentsCount > 0) {
      breakdown.push(`${settlement.hostelPaymentsCount} Hostel`);
    }
    if (settlement.issuancePaymentsCount > 0) {
      breakdown.push(`${settlement.issuancePaymentsCount} Issuance`);
    }
    return breakdown.join(", ");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Settlement History
        </CardTitle>
        <CardDescription>
          View all completed settlements and their details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("settlementDate")}
                    className="h-auto p-0 font-semibold"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Settlement Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("amount")}
                    className="h-auto p-0 font-semibold"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Payments Included</TableHead>
                <TableHead>Breakdown</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Recorded By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialSettlements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No settlements found
                  </TableCell>
                </TableRow>
              ) : (
                initialSettlements.map((settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell className="font-medium">
                      {formatDate(settlement.settlementDate)}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(settlement.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{settlement.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getTotalPaymentsCount(settlement)} payments
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getPaymentBreakdown(settlement)}
                    </TableCell>
                    <TableCell>
                      {settlement.referenceNumber ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          {settlement.referenceNumber}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {settlement.recordedBy}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} settlements
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
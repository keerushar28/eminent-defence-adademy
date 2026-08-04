"use client";

import { ExpenseEntry } from "../types/expense";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/core/components/table";
import { Card, CardContent } from "@/features/core/components/card";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/features/core/components/skeleton";

interface ExpenseTableProps {
  entries: ExpenseEntry[];
  loading?: boolean;
  itemsPerPage?: number;
}

export default function ExpenseTable({ entries, loading, itemsPerPage = 20 }: ExpenseTableProps) {
  if (loading) {
    return (
      <Card className="border shadow-xs">
        <CardContent className="pt-6">
          <div className="space-y-3">
            {Array.from({ length: itemsPerPage }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="border shadow-xs">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">No expense entries found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 text-center font-semibold">#</TableHead>
              <TableHead className="font-semibold">Bill Date</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold">Billing Title</TableHead>
              <TableHead className="font-semibold">Vendor</TableHead>
              <TableHead className="font-semibold">Items</TableHead>
              <TableHead className="font-semibold">Period</TableHead>
              <TableHead className="font-semibold text-right">Amount</TableHead>
              <TableHead className="font-semibold">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow key={entry.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="text-center font-medium text-sm">
                  {index + 1}
                </TableCell>
                <TableCell className="text-sm">
                  {formatNepaliDateFromDate(new Date(entry.billDate))}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {entry.categoryName}
                </TableCell>
                <TableCell className="text-sm">
                  {entry.billingTitle || "-"}
                </TableCell>
                <TableCell className="text-sm">
                  {entry.vendorName || "-"}
                </TableCell>
                <TableCell className="text-sm max-w-xs truncate" title={entry.items}>
                  {entry.items || "-"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatNepaliDateFromDate(new Date(entry.periodStartDate))} to{" "}
                  {formatNepaliDateFromDate(new Date(entry.periodEndDate))}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(entry.amount, "NPR")}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {entry.description || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

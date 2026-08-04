"use client";

import { LedgerEntry } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/core/components/table";
import { Card, CardContent } from "@/features/core/components/card";
import { Badge } from "@/features/core/components/badge";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/features/core/components/skeleton";

interface LedgerTableProps {
  entries: LedgerEntry[];
  loading?: boolean;
  itemsPerPage?: number;
}

const sourceColors: Record<string, string> = {
  STUDENT_CATEGORY: "bg-blue-100 text-blue-800",
  HOSTEL: "bg-purple-100 text-purple-800",
  INVENTORY_BILL: "bg-green-100 text-green-800",
  INVENTORY_ISSUANCE: "bg-orange-100 text-orange-800",
};

const methodColors: Record<string, string> = {
  CASH: "bg-green-100 text-green-800",
  ONLINE: "bg-blue-100 text-blue-800",
  BANK_TRANSFER: "bg-indigo-100 text-indigo-800",
  CHEQUE: "bg-yellow-100 text-yellow-800",
  CARD: "bg-pink-100 text-pink-800",
};

export default function LedgerTable({ entries, loading, itemsPerPage = 20 }: LedgerTableProps) {
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
            <p className="text-muted-foreground">No ledger entries found</p>
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
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Paid By</TableHead>
              <TableHead className="font-semibold">Source</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold">Method</TableHead>
              <TableHead className="font-semibold text-right">Amount</TableHead>
              <TableHead className="font-semibold">Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow key={entry.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="text-center font-medium text-sm">
                  {index + 1}
                </TableCell>
                <TableCell className="text-sm">
                  {formatNepaliDateFromDate(new Date(entry.paymentDate))}
                </TableCell>
                <TableCell className="text-sm">
                  <div>
                    <p className="font-medium">{entry.paidBy}</p>
                    {entry.paidByEmail && (
                      <p className="text-xs text-muted-foreground">{entry.paidByEmail}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={sourceColors[entry.source] || "bg-gray-100 text-gray-800"}>
                    {entry.source.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  <div>
                    {entry.category && <p className="font-medium">{entry.category}</p>}
                    {entry.subCategory && (
                      <p className="text-xs text-muted-foreground">{entry.subCategory}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={methodColors[entry.paymentMethod] || "bg-gray-100 text-gray-800"}>
                    {entry.paymentMethod.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(entry.amount, "NPR")}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {entry.referenceNumber || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

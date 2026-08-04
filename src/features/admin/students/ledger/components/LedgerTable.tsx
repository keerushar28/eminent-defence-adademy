"use client";

import { LedgerStudent } from "../actions/ledger-actions";
import { Badge } from "@/features/core/components/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/features/core/components/avatar";
import { Button } from "@/features/core/components/button";
import { Skeleton } from "@/features/core/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/core/components/table";
import { format } from "date-fns";
import NepaliDate from "nepali-date-converter";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import { Eye } from "lucide-react";

interface LedgerTableProps {
  students: LedgerStudent[];
  onViewDetails: (student: LedgerStudent) => void;
  loading?: boolean;
  itemsPerPage?: number;
}

export default function LedgerTable({
  students,
  onViewDetails,
  loading = false,
  itemsPerPage = 20
}: LedgerTableProps) {

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FULLY_PAID":
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
            Fully Paid
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
            Pending
          </Badge>
        );
      case "UNPAID":
        return (
          <Badge className="bg-rose-500 hover:bg-rose-600 text-white">
            Unpaid
          </Badge>
        );
      case "NO_ALLOCATION":
        return (
          <Badge className="bg-gray-500 hover:bg-gray-600 text-white">
            No Allocation
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return `NPR ${amount.toLocaleString("en-NP", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Skeleton row component
  const SkeletonRow = () => (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-4 w-24 ml-auto" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-4 w-24 ml-auto" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-4 w-24 ml-auto" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-4 w-24 ml-auto" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-20" />
      </TableCell>
      <TableCell className="text-center">
        <Skeleton className="h-8 w-16 mx-auto" />
      </TableCell>
    </TableRow>
  );

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12 text-center font-semibold">#</TableHead>
            <TableHead className="font-semibold">Student</TableHead>
            <TableHead className="font-semibold">Categories</TableHead>
            <TableHead className="text-right font-semibold">Total Fee</TableHead>
            <TableHead className="text-right font-semibold">Total Paid</TableHead>
            <TableHead className="text-right font-semibold">Discount</TableHead>
            <TableHead className="text-right font-semibold">Pending</TableHead>
            <TableHead className="font-semibold">Last Payment</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="text-center font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            // Show skeleton rows while loading
            Array.from({ length: itemsPerPage }).map((_, index) => (
              <SkeletonRow key={`skeleton-${index}`} />
            ))
          ) : students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-12">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <svg
                    className="w-12 h-12 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="font-medium">No students found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            students.map((student, index) => (
              <TableRow
                key={student.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <TableCell className="text-center font-medium text-sm">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                      <AvatarImage src={student.student_image} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {student.fullname.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{student.fullname}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {student.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {student.categories.map((cat, idx) => (
                      <Badge
                        key={idx}
                        variant={cat.isActive ? "secondary" : "outline"}
                        className={`text-xs font-normal ${!cat.isActive ? 'opacity-60' : ''}`}
                        title={cat.isActive ? 'Active' : 'De-allocated'}
                      >
                        {cat.categoryName} - {cat.subCategoryName}
                        {!cat.isActive && ' (De-allocated)'}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(student.totalFee)}
                </TableCell>
                <TableCell className="text-right font-medium text-emerald-600">
                  {formatCurrency(student.totalPaid)}
                </TableCell>
                <TableCell className="text-right font-medium text-blue-600">
                  {formatCurrency(student.totalDiscount)}
                </TableCell>
                <TableCell className="text-right font-medium text-rose-600">
                  {formatCurrency(student.pendingAmount)}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {student.lastPaymentDate
                      ? formatNepaliDateFromDate(new Date(student.lastPaymentDate))
                      : <span className="text-muted-foreground">No payments</span>}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(student.status)}</TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(student)}
                    className="hover:bg-primary/10"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

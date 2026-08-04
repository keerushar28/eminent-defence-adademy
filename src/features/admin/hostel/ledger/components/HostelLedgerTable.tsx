"use client";

import { useMemo, useState, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { HostelLedgerStudent } from "../types";
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
import { Eye, Bed, DoorOpen, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency } from "../utils/utils";
import { useSidebar } from "@/features/core/components/sidebar";
import { cn } from "@/features/core/lib/utils";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import { useIsAdmin } from "../../hooks/useIsAdmin";

interface HostelLedgerTableProps {
  students: HostelLedgerStudent[];
  onViewDetails: (student: HostelLedgerStudent) => void;
  loading?: boolean;
  itemsPerPage?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tableInstanceRef?: (table: any) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "FULLY_PAID":
      return (
        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
          Fully Paid
        </Badge>
      );
    case "PARTIAL":
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
          Partial
        </Badge>
      );
    case "PENDING":
      return (
        <Badge className="bg-rose-500 hover:bg-rose-600 text-white">
          Pending
        </Badge>
      );
    case "OVERPAID":
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
          Overpaid
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

function createColumns(
  onViewDetails: (student: HostelLedgerStudent) => void,
  isAdmin: boolean
): ColumnDef<HostelLedgerStudent>[] {
  const baseColumns: ColumnDef<HostelLedgerStudent>[] = [
    {
      accessorKey: "fullname",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 text-sm"
          >
            Student
            {isSorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-background shadow-sm">
              <AvatarImage src={student.student_image} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {student.fullname.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-medium truncate text-sm">{student.fullname}</div>
              <div className="text-sm text-muted-foreground truncate">
                {student.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "roomNumber",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 text-sm"
          >
            Room & Bed
            {isSorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <DoorOpen className="h-4 w-4 text-muted-foreground" />
              R{student.roomNumber}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bed className="h-3 w-3" />
              B{student.bedNumber}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "pricePerDay",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 text-sm justify-end"
          >
            Price/Day
            {isSorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="text-right font-medium text-sm">
            {formatCurrency(row.getValue("pricePerDay"))}
          </div>
        );
      },
    },
    {
      accessorKey: "totalPaid",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 text-sm justify-end"
          >
            Total Paid
            {isSorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="text-right">
            <div className="font-medium text-emerald-600 text-sm">
              {formatCurrency(student.totalPaid)}
            </div>
            <div className="text-sm text-muted-foreground">
              {student.daysPaid}d
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "pendingAmount",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 text-sm justify-end"
          >
            Pending
            {isSorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="text-right font-medium text-rose-600 text-sm">
            {formatCurrency(row.getValue("pendingAmount"))}
          </div>
        );
      },
    },
    {
      accessorKey: "paidUntil",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 text-sm"
          >
            Paid Until
            {isSorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="text-sm">
            {formatNepaliDateFromDate(new Date(row.getValue("paidUntil")))}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        return getStatusBadge(row.getValue("status"));
      },
    },
  ];

  // Add overpaid column only for admin users
  if (isAdmin) {
    baseColumns.splice(baseColumns.length, 0, {
      accessorKey: "overpaidAmount",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 text-sm justify-end"
          >
            Overpaid
            {isSorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const amount = row.getValue("overpaidAmount") as number;
        return (
          <div className="text-right font-medium text-blue-600 text-sm">
            {amount > 0 ? formatCurrency(amount) : "-"}
          </div>
        );
      },
    });
  }

  // Add actions column at the end
  baseColumns.push({
    id: "actions",
    header: () => <div className="text-center text-sm">Actions</div>,
    cell: ({ row }) => {
      return (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(row.original)}
            className="h-8 px-3 hover:bg-primary/10"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  });

  return baseColumns;
}

export default function HostelLedgerTable({
  students,
  onViewDetails,
  loading = false,
  itemsPerPage = 20,
  tableInstanceRef,
  columnVisibility: externalColumnVisibility,
  onColumnVisibilityChange,
}: HostelLedgerTableProps) {
  const isAdmin = useIsAdmin();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    overpaidAmount: !isAdmin, // Hide overpaid column for non-admin users
  });

  const columns = useMemo(() => createColumns(onViewDetails, isAdmin), [onViewDetails, isAdmin]);

  const handleColumnVisibilityChange = (updaterOrValue: VisibilityState | ((old: VisibilityState) => VisibilityState)) => {
    const newVisibility = typeof updaterOrValue === 'function' 
      ? (updaterOrValue as (old: VisibilityState) => VisibilityState)(columnVisibility)
      : updaterOrValue;
    setColumnVisibility(newVisibility);
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(newVisibility);
    }
  };

  const table = useReactTable({
    data: students,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    state: {
      sorting,
      columnVisibility: externalColumnVisibility || columnVisibility,
    },
  });

  // Expose table instance to parent
  useEffect(() => {
    if (tableInstanceRef) {
      tableInstanceRef(table);
    }
  }, [table, tableInstanceRef]);

  // Skeleton row component
  const SkeletonRow = () => (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-2.5 w-32" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-3 w-16" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-3 w-20 ml-auto" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-3 w-20 ml-auto" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-3 w-20 ml-auto" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-3 w-20 ml-auto" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-3 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell className="text-center">
        <Skeleton className="h-6 w-6 mx-auto" />
      </TableCell>
    </TableRow>
  );
  const { state } = useSidebar()



  return (
    <div className={cn("flex flex-col gap-3", state === "collapsed" ? "w-full" : "md:w-[calc(100vw-20rem)] ")}>
      <div className="flex items-center flex-wrap">
        <Table className="border border-slate-200 dark:border-slate-700 rounded-lg">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-sm font-semibold text-slate-700 dark:text-slate-300 h-10 px-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: itemsPerPage }).map((_, index) => (
                <SkeletonRow key={`skeleton-${index}`} />
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm py-3 px-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                    <Bed className="w-10 h-10" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No students found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

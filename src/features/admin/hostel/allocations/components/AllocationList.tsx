"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal, UserX, Trash2 } from "lucide-react";
import { Button } from "@/features/core/components/button";
import { Checkbox } from "@/features/core/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/core/components/dropdown-menu";
import { Input } from "@/features/core/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/core/components/table";
import { Badge } from "@/features/core/components/badge";
import { useState, useMemo, useEffect, useRef } from "react";
import { Allocation } from "../../types/hostel.types";
import { calculatePendingDays, calculatePendingAmount, calculateOverpaidAmount } from "../../lib/calculations";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import { useIsAdmin } from "../../hooks/useIsAdmin";
import Pagination from "@/features/core/components/shared/pagination";
import { useSidebar } from "@/features/core/components/sidebar";
import { cn } from "@/features/core/lib/utils";

interface AllocationListProps {
  allocations: Allocation[];
  onDeallocate: (allocation: Allocation) => void;
  onDelete: (allocation: Allocation) => void;
}

export default function AllocationList({ allocations, onDeallocate, onDelete }: AllocationListProps) {
  const isAdmin = useIsAdmin();
  const { state } = useSidebar();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    overpaid: isAdmin, // Hide overpaid column for non-admin users
  });
  const [rowSelection, setRowSelection] = useState({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Search state with debouncing
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Update column visibility when role changes
  useEffect(() => {
    setColumnVisibility({
      overpaid: isAdmin,
    });
  }, [isAdmin]);

  // Debounce search query
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  // Calculate billing status for each allocation
  const allocationsWithBilling = useMemo(() => {
    return allocations.map(allocation => {
      // For deallocated allocations, use the deallocation date; otherwise use today
      const currentDate = !allocation.isActive && allocation.deallocationDate
        ? new Date(allocation.deallocationDate)
        : new Date();
      const effectivePrice = allocation.bed?.pricePerDay || 0;
      const creditBalance = allocation.creditBalance || 0;

      // Calculate total paid (sum of all payments)
      const totalPaid = (allocation.payments || []).reduce((sum, payment) => sum + (payment.amount || 0), 0);

      // Calculate pending fees
      const pendingDays = calculatePendingDays(new Date(allocation.paidUntil), currentDate, new Date(allocation.allocationDate));
      const pendingAmount = calculatePendingAmount(pendingDays, effectivePrice);

      // Calculate overpaid amount based on actual payments vs consumed days
      const overpaidAmount = calculateOverpaidAmount(
        new Date(allocation.allocationDate),
        currentDate,
        totalPaid,
        effectivePrice
      );

      // Calculate overpaid days for display
      const overpaidDays = effectivePrice > 0 ? Math.floor(overpaidAmount / effectivePrice) : 0;

      return {
        ...allocation,
        pendingDays,
        pendingAmount,
        overpaidDays,
        overpaidAmount,
        totalPaid,
        creditBalance,
        effectivePrice,
      };
    });
  }, [allocations]);

  const columns: ColumnDef<typeof allocationsWithBilling[0]>[] = useMemo(() => {
    const baseColumns: ColumnDef<typeof allocationsWithBilling[0]>[] = [
      {
        id: "serial",
        header: () => (
          <div className="w-10 text-center text-sm font-medium text-muted-foreground">#</div>
        ),
        cell: ({ row, table }) => (
          <div className="w-10 text-center text-sm font-medium">
            {(table.getState().pagination.pageIndex || 0) * table.getState().pagination.pageSize + row.index + 1}
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "student.fullname",
        id: "studentName",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 text-sm"
            >
              Student Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const allocation = row.original;
          const studentName = allocation.student?.fullname || "Unknown";
          const studentEmail = allocation.student?.email || "Unknown";
          return <div className="font-medium text-sm flex flex-col">
            <p> {studentName}</p>
            <p className="text-xs"> {studentEmail}</p>

          </div>;
        },
        enableColumnFilter: true,
        filterFn: "includesString",
      },
      {
        id: "roomBed",
        header: "Room / Bed",
        cell: ({ row }) => {
          const allocation = row.original;
          const roomNumber = allocation.bed?.room?.roomNumber || "N/A";
          const bedNumber = allocation.bed?.bedNumber || "N/A";
          return (
            <div className="flex flex-col gap-1">
              <div className="font-medium text-sm">R{roomNumber}</div>
              <div className="text-sm text-muted-foreground">B{bedNumber}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "allocationDate",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 text-sm"
            >
              Allocation Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = new Date(row.getValue("allocationDate"));
          return <div className="text-sm">{formatNepaliDateFromDate(date)}</div>;
        },
      },
      {
        accessorKey: "paidUntil",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 text-sm"
            >
              Paid Until
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = new Date(row.getValue("paidUntil"));
          return <div className="text-sm">{formatNepaliDateFromDate(date)}</div>;
        },
      },
      {
        id: "totalPaid",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 text-sm justify-end"
            >
              Total Paid
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        accessorFn: (row) => row.totalPaid,
        cell: ({ row }) => {
          const allocation = row.original;
          return (
            <div className="font-medium text-primary text-sm text-right">
              NPR {allocation.totalPaid.toFixed(2)}
            </div>
          );
        },
      },
      {
        id: "pendingFees",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 text-sm justify-end"
            >
              Pending Fees
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        accessorFn: (row) => row.pendingAmount,
        cell: ({ row }) => {
          const allocation = row.original;
          if (allocation.pendingAmount > 0) {
            return (
              <div className="text-sm">
                <div className="font-medium text-destructive">
                  NPR {(allocation.pendingAmount - allocation.creditBalance).toFixed(2)}
                </div>
              </div>
            );
          }
          return <div className="text-muted-foreground text-sm">-</div>;
        },
        filterFn: (row, id, value) => {
          if (value === "all") return true;
          if (value === "pending") return row.original.pendingAmount > 0;
          if (value === "none") return row.original.pendingAmount === 0;
          return true;
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => {
          const isActive = row.getValue("isActive") as boolean;
          const allocation = row.original;

          if (!isActive && allocation.deallocationDate) {
            return (
              <div>
                <Badge variant="secondary" className="text-sm">Deallocated</Badge>
                <div className="text-sm text-muted-foreground mt-1">
                  {formatNepaliDateFromDate(new Date(allocation.deallocationDate))}
                </div>
              </div>
            );
          }

          return (
            <Badge variant="default" className="text-sm">
              Active
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          if (value === "all") return true;
          if (value === "active") return row.getValue(id) === true;
          if (value === "inactive") return row.getValue(id) === false;
          return true;
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const allocation = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {allocation.isActive && (
                  <DropdownMenuItem
                    onClick={() => onDeallocate(allocation)}
                    className="text-destructive focus:text-destructive text-sm"
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Deallocate
                  </DropdownMenuItem>
                )}
                {allocation.isActive && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={() => onDelete(allocation)}
                  className="text-destructive focus:text-destructive text-sm"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ];

    // Add overpaid column only for admin users
    if (isAdmin) {
      baseColumns.splice(baseColumns.length - 1, 0, {
        id: "overpaid",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 text-sm justify-end"
            >
              Overpaid
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        accessorFn: (row) => row.overpaidAmount,
        cell: ({ row }) => {
          const allocation = row.original;
          if (allocation.overpaidAmount > 0) {
            return (
              <div className="text-sm">
                <div className="font-medium text-primary">
                  NPR {allocation.overpaidAmount.toFixed(2)}
                </div>
                {allocation.creditBalance > 0 && (
                  <div className="text-sm text-muted-foreground">
                    (NPR {allocation.creditBalance.toFixed(2)})
                  </div>
                )}
              </div>
            );
          }
          return <div className="text-muted-foreground text-sm">-</div>;
        },
        filterFn: (row, id, value) => {
          if (value === "all") return true;
          if (value === "overpaid") return row.original.overpaidAmount > 0;
          if (value === "none") return row.original.overpaidAmount === 0;
          return true;
        },
      });
    }

    return baseColumns;
  }, [isAdmin]);

  // Apply search filter
  const filteredAllocations = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return allocationsWithBilling;
    
    const query = debouncedSearchQuery.toLowerCase();
    return allocationsWithBilling.filter(allocation => {
      const studentName = allocation.student?.fullname?.toLowerCase() || "";
      const studentEmail = allocation.student?.email?.toLowerCase() || "";
      const roomNumber = allocation.bed?.room?.roomNumber?.toLowerCase() || "";
      const bedNumber = allocation.bed?.bedNumber?.toLowerCase() || "";
      
      return (
        studentName.includes(query) ||
        studentEmail.includes(query) ||
        roomNumber.includes(query) ||
        bedNumber.includes(query)
      );
    });
  }, [allocationsWithBilling, debouncedSearchQuery]);

  // Apply pagination
  const paginatedAllocations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAllocations.slice(startIndex, endIndex);
  }, [filteredAllocations, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAllocations.length / itemsPerPage);

  const table = useReactTable({
    data: paginatedAllocations,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    manualPagination: true,
    pageCount: totalPages,
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
  };

  // Show empty state if no allocations
  if (allocations.length === 0) {
    return (
      <div className="w-full">
        <div className="rounded-md border p-12 text-center">
          <UserX className="mx-auto h-14 w-14 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-3">No allocations found</h3>
          <p className="text-muted-foreground text-base">
            No student allocations have been created yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-4", state === "collapsed" ? "w-full" : "md:w-[calc(100vw-18rem)]")}>
      {/* Filters */}
      <div className=" rounded-lg p-4 border space-y-4">
        <h3 className="text-base font-semibold">Filters</h3>
        <div className="flex flex-col md:flex-row gap-3 md:items-center flex-wrap">
          <Input
            placeholder="Search students, room, or bed..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-10 text-sm flex-1 min-w-0 md:max-w-xs"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 text-sm">
                Status <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => table.getColumn("isActive")?.setFilterValue("all")} className="text-sm">
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn("isActive")?.setFilterValue("active")} className="text-sm">
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn("isActive")?.setFilterValue("inactive")} className="text-sm">
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 text-sm">
                Pending <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => table.getColumn("pendingFees")?.setFilterValue("all")} className="text-sm">
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn("pendingFees")?.setFilterValue("pending")} className="text-sm">
                Has Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn("pendingFees")?.setFilterValue("none")} className="text-sm">
                No Pending
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 text-sm">
                  Overpaid <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => table.getColumn("overpaid")?.setFilterValue("all")} className="text-sm">
                  All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => table.getColumn("overpaid")?.setFilterValue("overpaid")} className="text-sm">
                  Overpaid
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => table.getColumn("overpaid")?.setFilterValue("none")} className="text-sm">
                  Not Overpaid
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 text-sm ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize text-sm"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted border-b">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-sm font-semibold h-10 px-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="border-b hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm py-3 px-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm">
                  No allocations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredAllocations.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredAllocations.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
}

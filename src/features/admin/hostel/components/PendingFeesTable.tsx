'use client'

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
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, AlertCircle, Eye } from "lucide-react"
import { Button } from "@/features/core/components/button"
import { Checkbox } from "@/features/core/components/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/features/core/components/dropdown-menu"
import { Input } from "@/features/core/components/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/core/components/table"
import { Badge } from "@/features/core/components/badge"
import { useState } from "react"
import { BillingInfo } from "../types/hostel.types"
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date"

interface PendingFeesTableProps {
  pendingFees: BillingInfo[]
  onViewStudent?: (studentId: string) => void
}

export default function PendingFeesTable({ pendingFees, onViewStudent }: PendingFeesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "pendingAmount", desc: true }
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const columns: ColumnDef<BillingInfo>[] = [
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
      accessorKey: "studentName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Student Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <div className="font-medium">{row.getValue("studentName")}</div>
      },
      enableColumnFilter: true,
      filterFn: "includesString",
    },
    {
      id: "roomBed",
      header: "Room / Bed",
      cell: ({ row }) => {
        const billing = row.original
        return (
          <div>
            <div className="font-medium">Room {billing.roomNumber}</div>
            <div className="text-sm text-muted-foreground">Bed {billing.bedNumber}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "pendingAmount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Pending Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const amount = row.getValue("pendingAmount") as number
        return (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="font-bold text-destructive">NPR {amount.toFixed(2)}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "pendingDays",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Days Pending
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const days = row.getValue("pendingDays") as number
        return (
          <Badge variant="destructive">
            {days} day{days !== 1 ? 's' : ''}
          </Badge>
        )
      },
    },
    {
      accessorKey: "paidUntil",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Paid Until
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("paidUntil"))
        return <div>{formatNepaliDateFromDate(date)}</div>
      },
    },
    {
      accessorKey: "pricePerDay",
      header: "Price/Day",
      cell: ({ row }) => {
        const price = row.getValue("pricePerDay") as number
        return <div className="text-sm">NPR {price.toFixed(2)}</div>
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean
        const billing = row.original
        
        if (!isActive && billing.deallocationDate) {
          return (
            <div>
              <Badge variant="secondary">Deallocated</Badge>
              <div className="text-xs text-muted-foreground mt-1">
              {formatNepaliDateFromDate(new Date(billing.deallocationDate))}
              </div>
            </div>
          )
        }
        
        return (
          <Badge variant="default">
            Active
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        if (value === "all") return true
        if (value === "active") return row.getValue(id) === true
        if (value === "deallocated") return row.getValue(id) === false
        return true
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const billing = row.original

        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewStudent?.(billing.studentId)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        )
      },
    },
  ]

  const table = useReactTable({
    data: pendingFees,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  // Calculate totals
  const totalPending = pendingFees.reduce((sum, fee) => sum + fee.pendingAmount, 0)
  const totalDays = pendingFees.reduce((sum, fee) => sum + fee.pendingDays, 0)

  // Show empty state if no pending fees
  if (pendingFees.length === 0) {
    return (
      <div className="w-full">
        <div className="rounded-md border p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No pending fees</h3>
          <p className="text-muted-foreground">
            All students are up to date with their payments.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-md bg-destructive/10">
          <div className="text-sm text-muted-foreground mb-1">Total Pending</div>
          <div className="text-2xl font-bold text-destructive">NPR {totalPending.toFixed(2)}</div>
        </div>
        <div className="p-4 border rounded-md bg-muted/30">
          <div className="text-sm text-muted-foreground mb-1">Students</div>
          <div className="text-2xl font-bold">{pendingFees.length}</div>
        </div>
        <div className="p-4 border rounded-md bg-muted/30">
          <div className="text-sm text-muted-foreground mb-1">Total Days Pending</div>
          <div className="text-2xl font-bold">{totalDays}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search students..."
            value={(table.getColumn("studentName")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("studentName")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Filter Status <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => table.getColumn("isActive")?.setFilterValue("all")}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn("isActive")?.setFilterValue("active")}>
                Active Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn("isActive")?.setFilterValue("deallocated")}>
                Deallocated Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
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
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No pending fees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

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
import { ArrowUpDown, ChevronDown, Receipt, Calendar } from "lucide-react"
import { Button } from "@/features/core/components/button"
import { Checkbox } from "@/features/core/components/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/features/core/components/dropdown-menu"
import { Input } from "@/features/core/components/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/core/components/table"
import { Badge } from "@/features/core/components/badge"
import { useState } from "react"
import { Payment } from "../types/hostel.types"
import { format } from "date-fns"

interface PaymentHistoryProps {
  payments: Payment[]
}

export default function PaymentHistory({ payments }: PaymentHistoryProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "paymentDate", desc: true }
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const columns: ColumnDef<Payment>[] = [
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
      accessorKey: "paymentDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Payment Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("paymentDate"))
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(date, "MMM dd, yyyy")}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number
        return (
          <div className="flex items-center gap-2 font-medium">
            <span>NPR {amount.toFixed(2)}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "daysPurchased",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Days Purchased
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const days = row.getValue("daysPurchased") as number
        return (
          <Badge variant="secondary">
            {days} day{days !== 1 ? 's' : ''}
          </Badge>
        )
      },
    },
    {
      accessorKey: "updatedPaidUntil",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Updated Paid Until
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("updatedPaidUntil"))
        return <div>{format(date, "MMM dd, yyyy")}</div>
      },
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment Method",
      cell: ({ row }) => {
        const method = row.getValue("paymentMethod") as string
        return (
          <Badge variant="outline">
            {method.replace(/_/g, ' ')}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        if (value === "all") return true
        return row.getValue(id) === value
      },
    },
    {
      accessorKey: "referenceNumber",
      header: "Reference",
      cell: ({ row }) => {
        const ref = row.getValue("referenceNumber") as string | undefined
        return (
          <div className="text-sm text-muted-foreground">
            {ref || "-"}
          </div>
        )
      },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => {
        const notes = row.getValue("notes") as string | undefined
        return (
          <div className="text-sm text-muted-foreground max-w-[200px] truncate">
            {notes || "-"}
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: payments,
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
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const totalDays = payments.reduce((sum, payment) => sum + payment.daysPurchased, 0)

  // Show empty state if no payments
  if (payments.length === 0) {
    return (
      <div className="w-full">
        <div className="rounded-md border p-12 text-center">
          <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No payments found</h3>
          <p className="text-muted-foreground">
            No payment records exist for this allocation yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-md bg-muted/30">
          <div className="text-sm text-muted-foreground mb-1">Total Payments</div>
          <div className="text-2xl font-bold">{payments.length}</div>
        </div>
        <div className="p-4 border rounded-md bg-muted/30">
          <div className="text-sm text-muted-foreground mb-1">Total Amount</div>
          <div className="text-2xl font-bold">NPR {totalAmount.toFixed(2)}</div>
        </div>
        <div className="p-4 border rounded-md bg-muted/30">
          <div className="text-sm text-muted-foreground mb-1">Total Days</div>
          <div className="text-2xl font-bold">{totalDays} days</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search reference..."
            value={(table.getColumn("referenceNumber")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("referenceNumber")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Payment Method <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => table.getColumn("paymentMethod")?.setFilterValue("all")}>
                All Methods
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn("paymentMethod")?.setFilterValue("CASH")}>
                Cash
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn("paymentMethod")?.setFilterValue("CARD")}>
                Card
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn("paymentMethod")?.setFilterValue("UPI")}>
                UPI
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn("paymentMethod")?.setFilterValue("BANK_TRANSFER")}>
                Bank Transfer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn("paymentMethod")?.setFilterValue("CHEQUE")}>
                Cheque
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn("paymentMethod")?.setFilterValue("OTHER")}>
                Other
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
                  No payments found.
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

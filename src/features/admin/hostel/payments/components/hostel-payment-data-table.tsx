'use client'

import { useState, useEffect, useMemo, useCallback } from "react"
import { useDebounce } from "@/features/core/hooks/useDebounce"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Loader2, Search, X, Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Skeleton } from "@/features/core/components/skeleton"
import { Button } from "@/features/core/components/button"
import { Badge } from "@/features/core/components/badge"
import { Input } from "@/features/core/components/input"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/features/core/components/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/features/core/components/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/features/core/components/alert-dialog"
import { toast } from "sonner"
import { getHostelPaymentsPaginated, deleteHostelPayment } from "../actions/hostel-payment-actions"
import Pagination from "@/features/core/components/shared/pagination"
import AddHostelPaymentDialog from "./AddHostelPaymentDialog"
import EditHostelPaymentDialog from "./EditHostelPaymentDialog"
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date"
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker"
import { useSession } from "next-auth/react"

interface HostelPayment {
    id: string
    amount: number
    paymentDate: Date
    daysPurchased: number
    updatedPaidUntil: Date
    paymentMethod: string
    referenceNumber: string | null
    notes: string | null
    createdBy: string
    allocation: {
        id: string
        student: {
            id: string
            fullname: string
            email: string
            contact_number_student: string
        }
        bed: {
            id: string
            bedNumber: string
            pricePerDay: number
            room: {
                id: string
                roomNumber: string
            }
        }
    }
}

const paymentMethodLabels: Record<string, string> = {
    CASH: "Cash",
    BANK_TRANSFER: "Bank Transfer",
    CHEQUE: "Cheque",
    ONLINE: "Online",
    CARD: "Card",
}

const paymentMethodColors: Record<string, string> = {
    CASH: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    BANK_TRANSFER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    CHEQUE: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    ONLINE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    CARD: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
}

function createColumns(userRole?: string, onPaymentDeleted?: (paymentId: string) => void, onPaymentEdited?: (payment: any) => void): ColumnDef<HostelPayment>[] {
    return [
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
            accessorKey: "paymentDate",
            header: ({ column }) => {
                const isSorted = column.getIsSorted()
                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 text-sm"
                    >
                        Payment Date
                        {isSorted === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                        ) : isSorted === "desc" ? (
                            <ArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                )
            },
            cell: ({ row }) => {
                const date = new Date(row.getValue("paymentDate"))
                return (
                    <div className="font-medium text-sm">
                        {formatNepaliDateFromDate(date)}
                    </div>
                )
            },
        },
        {
            id: "studentName",
            accessorFn: (row) => row.allocation.student.fullname,
            header: ({ column }) => {
                const isSorted = column.getIsSorted()
                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 text-sm"
                    >
                        Student Name
                        {isSorted === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                        ) : isSorted === "desc" ? (
                            <ArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                )
            },
            cell: ({ row }) => {
                const student = row.original.allocation.student
                return (
                    <div>
                        <p className="font-medium text-sm">{student.fullname}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                )
            },
        },
        {
            id: "roomBed",
            accessorFn: (row) => row.allocation.bed.room.roomNumber,
            header: "Room & Bed",
            cell: ({ row }) => {
                const bed = row.original.allocation.bed
                return (
                    <div className="flex flex-col gap-1">
                        <p className="font-medium text-sm">R{bed.room.roomNumber}</p>
                        <p className="text-sm text-muted-foreground">B{bed.bedNumber}</p>
                    </div>
                )
            },
        },
        {
            accessorKey: "amount",
            header: ({ column }) => {
                const isSorted = column.getIsSorted()
                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 text-sm"
                    >
                        Amount
                        {isSorted === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                        ) : isSorted === "desc" ? (
                            <ArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                )
            },
            cell: ({ row }) => {
                const amount = row.getValue("amount") as number
                return (
                    <div className="font-semibold text-green-600 text-sm">
                        Rs {amount.toLocaleString()}
                    </div>
                )
            },
        },

        {
            accessorKey: "updatedPaidUntil",
            header: "Paid Until",
            cell: ({ row }) => {
                const date = new Date(row.getValue("updatedPaidUntil"))
                return (
                    <div className="text-sm">
                        {formatNepaliDateFromDate(date)}
                    </div>
                )
            },
        },
        {
            accessorKey: "paymentMethod",
            header: "Payment Method",
            cell: ({ row }) => {
                const method = row.getValue("paymentMethod") as string
                return (
                    <Badge className={`${paymentMethodColors[method] || ""} text-sm`}>
                        {paymentMethodLabels[method] || method}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "referenceNumber",
            header: "Reference",
            cell: ({ row }) => {
                const ref = row.getValue("referenceNumber") as string | null
                return (
                    <div className="text-sm">
                        {ref || <span className="text-muted-foreground">-</span>}
                    </div>
                )
            },
        },
        {
            id: "notes",
            header: "Notes",
            cell: ({ row }) => {
                const notes = row.original.notes
                if (!notes) return <span className="text-muted-foreground text-sm">-</span>

                return (
                    <div className="max-w-xs">
                        <p className="text-sm truncate" title={notes}>
                            {notes}
                        </p>
                    </div>
                )
            },
        },
        ...(userRole === "ADMIN" || userRole === "SUPER_ADMIN" ? [{
            id: "actions",
            header: "Actions",
            cell: ({ row }: { row: any }) => {
                const payment = row.original
                const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
                const [isDeleting, setIsDeleting] = useState(false)

                const handleDelete = async () => {
                    setIsDeleting(true)
                    try {
                        const result = await deleteHostelPayment(payment.id)
                        if (result.success) {
                            toast.success("Payment deleted successfully")
                            onPaymentDeleted?.(payment.id)
                        } else {
                            toast.error(result.error || "Failed to delete payment")
                        }
                    } catch (error) {
                        toast.error("An error occurred while deleting the payment")
                    } finally {
                        setIsDeleting(false)
                        setIsDeleteDialogOpen(false)
                    }
                }

                return (
                    <>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => onPaymentEdited?.(payment)}
                                    className="cursor-pointer"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit payment
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                    className="text-red-600 cursor-pointer"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Payment
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete this payment of Rs {payment.amount.toLocaleString()}? This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            'Delete'
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )
            },
        }] : []),
    ]
}

export default function HostelPaymentDataTable() {
    const { data: session } = useSession()
    const userRole = session?.user?.role
    const [payments, setPayments] = useState<HostelPayment[]>([])
    const [loading, setLoading] = useState(true)
    const [initialLoad, setInitialLoad] = useState(true)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [editingPayment, setEditingPayment] = useState<HostelPayment | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalCount, setTotalCount] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    // Filter state
    const [searchInput, setSearchInput] = useState("")
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    })

    // Sorting state

    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    // Debounce search input (500ms delay)
    const debouncedSearch = useDebounce(searchInput, 500)

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)

            const paymentsResult = await getHostelPaymentsPaginated({
                page: currentPage,
                pageSize,
                search: debouncedSearch,
                dateFrom: dateRange.from?.toISOString(),
                dateTo: dateRange.to?.toISOString(),
            })

            setPayments(paymentsResult.payments as HostelPayment[])
            setTotalCount(paymentsResult.totalCount)
            setTotalPages(paymentsResult.totalPages)
            setInitialLoad(false)
        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("Failed to load hostel payments")
        } finally {
            setLoading(false)
        }
    }, [currentPage, pageSize, debouncedSearch, dateRange,])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Reset to page 1 when filters change
    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1)
        }
    }, [debouncedSearch, dateRange])

    const columns = useMemo(() => createColumns(userRole, (paymentId) => {
        setPayments((prevPayments) => prevPayments.filter((p) => p.id !== paymentId))
        setTotalCount((prev) => Math.max(0, prev - 1))
        setTotalPages((prev) => Math.ceil(Math.max(0, prev * pageSize - 1) / pageSize))
    }, (payment) => {
        setEditingPayment(payment)
        setIsEditDialogOpen(true)
    }), [userRole, pageSize])

    const table = useReactTable({
        data: payments,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        pageCount: totalPages,
        state: {
            columnVisibility,
        },
    })

    const clearFilters = () => {
        setDateRange({ from: undefined, to: undefined })
        setSearchInput("")
        setCurrentPage(1)
    }

    const hasActiveFilters = dateRange.from || dateRange.to || searchInput

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Skeleton row component
    const SkeletonRow = () => (
        <TableRow>
            <TableCell><Skeleton className="h-3 w-20" /></TableCell>
            <TableCell>
                <Skeleton className="h-3 w-28 mb-1" />
                <Skeleton className="h-2.5 w-32" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-2.5 w-14" />
            </TableCell>
            <TableCell><Skeleton className="h-3 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
            <TableCell><Skeleton className="h-3 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-3 w-16" /></TableCell>
            <TableCell><Skeleton className="h-3 w-14" /></TableCell>
        </TableRow>
    )

    return (
        <div className="w-full space-y-4">
            {/* Toolbar */}
            <div className=" rounded-lg p-4 border  space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold ">Filters</h3>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-10 px-3 text-sm"
                        >
                            Clear
                            <X className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-3 md:items-center flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-0 md:max-w-xs">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search..."
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            className="pl-10 h-10 text-sm"
                        />
                        {searchInput && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {debouncedSearch !== searchInput && (
                                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Nepali Date Range Filter */}
                    <div className="flex gap-3 items-center">
                        <NepaliDatePicker
                            value={dateRange.from}
                            onChange={(date) => setDateRange({ ...dateRange, from: date instanceof Date ? date : undefined })}
                            placeholder="From"
                            mode="single"
                        />
                        <span className="text-slate-400 text-sm">-</span>
                        <NepaliDatePicker
                            value={dateRange.to}
                            onChange={(date) => setDateRange({ ...dateRange, to: date instanceof Date ? date : undefined })}
                            placeholder="To"
                            mode="single"
                        />
                    </div>

                    {/* Columns & Add Button */}
                    <div className="flex items-center gap-2 ml-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-10 text-sm">
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
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(!!value)
                                                }
                                            >
                                                {column.id}
                                            </DropdownMenuCheckboxItem>
                                        )
                                    })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button size="sm" onClick={() => setIsAddDialogOpen(true)} className="h-10 text-sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Payment
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border ">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="text-sm font-semibold h-10 px-3">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            // Show skeleton rows while loading
                            Array.from({ length: pageSize }).map((_, index) => (
                                <SkeletonRow key={`skeleton-${index}`} />
                            ))
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} className="border-b  ">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="text-sm py-3 px-3">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-sm"
                                >
                                    No hostel payments found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {!initialLoad && totalCount > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalCount}
                    itemsPerPage={pageSize}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={(newSize) => {
                        setPageSize(newSize)
                        setCurrentPage(1)
                    }}
                    loading={loading}
                />
            )}

            {/* Add Payment Dialog */}
            <AddHostelPaymentDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onSuccess={fetchData}
            />

            {/* Edit Payment Dialog */}
            <EditHostelPaymentDialog
                isOpen={isEditDialogOpen}
                onClose={() => {
                    setIsEditDialogOpen(false)
                    setEditingPayment(null)
                }}
                onSuccess={(updatedPayment) => {
                    setPayments((prevPayments) =>
                        prevPayments.map((p) => (p.id === updatedPayment.id ? updatedPayment : p))
                    )
                    setEditingPayment(null)
                }}
                payment={editingPayment}
            />
        </div>
    )
}

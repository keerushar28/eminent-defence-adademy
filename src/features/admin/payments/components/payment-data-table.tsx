'use client'

import { useState, useEffect, useMemo, useCallback } from "react"
import { useDebounce } from "@/features/core/hooks/useDebounce"
import { useSubCategoryFilter } from "@/features/core/hooks/useSubCategoryFilter"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Plus, Loader2, Search, X, Trash2, MoreHorizontal, Edit } from "lucide-react"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/features/core/components/select"
import { NepaliDateRangePicker } from "@/features/core/components/nepali-date-range-picker"
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
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date"
import { getPaymentsPaginated, getPaymentCategories, getPaymentSubCategories, deletePayment } from "../actions/payment-actions"
import AddPaymentDialog from "./AddPaymentDialog"
import EditPaymentDialog from "./EditPaymentDialog"
import Pagination from "@/features/core/components/shared/pagination"
import { useSidebar } from "@/features/core/components/sidebar"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { type ExportOptions, type ExportColumn } from "@/lib/export-utils"

interface PaymentDataTableProps {
    onExportOptionsChange?: (options: ExportOptions) => void
}

interface Payment {
    id: string
    amount: number
    paymentDate: Date
    paymentMethod: string
    referenceNumber: string | null
    notes: string | null
    createdBy: string
    studentCategory: {
        id: string
        discountAmount: number
        finalFee: number
        totalPaid: number
        student: {
            id: string
            fullname: string
            email: string
            contact_number_student: string
        }
        subCategory: {
            id: string
            name: string
            fee: number
            category: {
                id: string
                name: string
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

function createColumns(userRole?: string, onPaymentDeleted?: (paymentId: string) => void, onPaymentEdited?: (payment: any) => void): ColumnDef<Payment>[] {
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
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
                    <div className="font-medium">
                        {formatNepaliDateFromDate(date)}
                    </div>
                )
            },
        },
        {
            id: "studentName",
            accessorFn: (row) => row.studentCategory.student.fullname,
            header: ({ column }) => {
                const isSorted = column.getIsSorted()
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
                const student = row.original.studentCategory.student
                return (
                    <div>
                        <p className="font-medium">{student.fullname}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                    </div>
                )
            },
        },
        {
            id: "categoryName",
            accessorFn: (row) => row.studentCategory.subCategory.name,
            header: "Category",
            cell: ({ row }) => {
                const subCategory = row.original.studentCategory.subCategory
                return (
                    <div>
                        <p className="font-medium">{subCategory.category.name}</p>
                        <p className="text-xs text-muted-foreground">{subCategory.name}</p>
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
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
                    <div className="font-semibold text-green-600">
                        NPR {amount.toLocaleString()}
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
                    <Badge className={paymentMethodColors[method] || ""}>
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
            id: "balance",
            header: "Balance Status",
            cell: ({ row }) => {
                const { finalFee, totalPaid } = row.original.studentCategory
                const remaining = finalFee - totalPaid

                if (remaining <= 0) {
                    return <Badge className="bg-green-500">Fully Paid</Badge>
                } else if (totalPaid > 0) {
                    return (
                        <div>
                            <Badge variant="secondary">Partial</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                                NPR {remaining.toLocaleString()} remaining
                            </p>
                        </div>
                    )
                } else {
                    return <Badge variant="destructive">Unpaid</Badge>
                }
            },
        },
        {
            id: "notes",
            header: "Notes",
            cell: ({ row }) => {
                const notes = row.original.notes
                if (!notes) return <span className="text-muted-foreground">-</span>

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
                        const result = await deletePayment(payment.id)
                        if (result.success) {
                            toast.success("Payment deleted successfully")
                            // Remove payment from local state via callback
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
                                        Are you sure you want to delete this payment of NPR {payment.amount.toLocaleString()}? This action cannot be undone.
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

export default function PaymentDataTable({ onExportOptionsChange }: PaymentDataTableProps) {
    const { state } = useSidebar()
    const { data: session } = useSession()
    const userRole = session?.user?.role
    const [payments, setPayments] = useState<Payment[]>([])
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
    const [subCategories, setSubCategories] = useState<{ id: string; name: string; categoryId: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [initialLoad, setInitialLoad] = useState(true)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalCount, setTotalCount] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    // Filter state
    const [searchInput, setSearchInput] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all")
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    })

    // Sorting state

    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    // Debounce search input (500ms delay)
    const debouncedSearch = useDebounce(searchInput, 500)

    // Fetch categories and sub categories on mount
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [categoriesData, subCategoriesData] = await Promise.all([
                    getPaymentCategories(),
                    getPaymentSubCategories(),
                ])
                setCategories(categoriesData)
                setSubCategories(subCategoriesData)
            } catch (error) {
                console.error("Error fetching filters:", error)
            }
        }
        fetchFilters()
    }, [])

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)

            const paymentsResult = await getPaymentsPaginated({
                page: currentPage,
                pageSize,
                search: debouncedSearch,
                category: selectedCategory,
                subCategory: selectedSubCategory,
                dateFrom: dateRange.from?.toISOString(),
                dateTo: dateRange.to?.toISOString(),
            })

            setPayments(paymentsResult.payments as Payment[])
            setTotalCount(paymentsResult.totalCount)
            setTotalPages(paymentsResult.totalPages)
            setInitialLoad(false)
        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("Failed to load payments")
        } finally {
            setLoading(false)
        }
    }, [currentPage, pageSize, debouncedSearch, selectedCategory, selectedSubCategory, dateRange])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Reset to page 1 when filters change
    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1)
        }
    }, [debouncedSearch, selectedCategory, selectedSubCategory, dateRange])

    // Use the reusable sub category filter hook
    const { filteredSubCategories } = useSubCategoryFilter(subCategories, selectedCategory, categories)

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

    // Compute export options from visible columns and payment data
    useEffect(() => {
        if (!onExportOptionsChange) return

        const allExportColumns: ExportColumn[] = [
            { header: "Payment Date", key: "paymentDate", width: 20 },
            { header: "Student Name", key: "studentName", width: 25 },
            { header: "Student Email", key: "studentEmail", width: 30 },
            { header: "Category", key: "categoryName", width: 25 },
            { header: "Sub-Category", key: "subCategoryName", width: 25 },
            { header: "Amount", key: "amount", width: 15 },
            { header: "Payment Method", key: "paymentMethod", width: 18 },
            { header: "Reference Number", key: "referenceNumber", width: 20 },
            { header: "Balance Status", key: "balanceStatus", width: 18 },
            { header: "Remaining", key: "remaining", width: 15 },
            { header: "Notes", key: "notes", width: 30 },
        ]

        const visibleColumns = allExportColumns.filter(
            (col) => columnVisibility[col.key] !== false
        )

        const exportData = payments.map((payment) => {
            const { finalFee, totalPaid } = payment.studentCategory
            const remaining = finalFee - totalPaid

            return {
                paymentDate: formatNepaliDateFromDate(new Date(payment.paymentDate)),
                studentName: payment.studentCategory.student.fullname,
                studentEmail: payment.studentCategory.student.email,
                categoryName: payment.studentCategory.subCategory.category.name,
                subCategoryName: payment.studentCategory.subCategory.name,
                amount: payment.amount,
                paymentMethod: paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod,
                referenceNumber: payment.referenceNumber || "-",
                balanceStatus: remaining <= 0 ? "Fully Paid" : totalPaid > 0 ? "Partial" : "Unpaid",
                remaining: remaining > 0 ? remaining : 0,
                notes: payment.notes || "-",
            }
        })

        // Compute summary totals for Amount and Remaining
        const totalAmount = exportData.reduce((sum, row) => sum + (row.amount as number), 0)
        const totalRemaining = exportData.reduce((sum, row) => sum + (row.remaining as number), 0)

        const visibleKeys = new Set(visibleColumns.map((col) => col.key))
        const summaryRow: Record<string, string | number> = {}
        if (visibleKeys.has("amount")) {
            summaryRow.amount = totalAmount
        }
        if (visibleKeys.has("remaining")) {
            summaryRow.remaining = totalRemaining
        }

        onExportOptionsChange({
            fileName: "payments-data",
            sheetName: "Payments",
            title: "Payments Management",
            subtitle: `Exported on ${new Date().toLocaleDateString()}`,
            columns: visibleColumns,
            data: exportData,
            ...(Object.keys(summaryRow).length > 0 && { summaryRow }),
        })
    }, [payments, columnVisibility, onExportOptionsChange])

    const clearFilters = () => {
        setSelectedCategory("all")
        setSelectedSubCategory("all")
        setDateRange({ from: undefined, to: undefined })
        setSearchInput("")
        setCurrentPage(1)
    }

    const hasActiveFilters = selectedCategory !== "all" || selectedSubCategory !== "all" || dateRange.from || dateRange.to || searchInput

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Skeleton row component
    const SkeletonRow = () => (
        <TableRow>
            <TableCell><Skeleton className="h-10 w-24" /></TableCell>
            <TableCell>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-40" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-3 w-24" />
            </TableCell>
            <TableCell><Skeleton className="h-6 w-28" /></TableCell>
            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        </TableRow>
    )

    return (
        <div className={cn("flex flex-col gap-4", state === "collapsed" ? "w-full" : "w-full")}>
            {/* Toolbar */}
            <div className="flex flex-col gap-3">
                {/* Main Toolbar - Search, Filters, and Actions */}
                <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
                    {/* Left side - Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-2 md:items-center flex-1 min-w-0">
                        {/* Search */}
                        <div className="relative flex-1 min-w-0 md:max-w-xs">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, category..."
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                className="pl-9 w-full"
                            />
                            {searchInput && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {debouncedSearch !== searchInput && (
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-2 items-center">
                            {/* Category Filter */}
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-full md:w-max border-border">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.name}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Sub Category Filter */}
                            <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
                                <SelectTrigger className="w-full md:w-max border-border">
                                    <SelectValue placeholder="All Sub Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sub Categories</SelectItem>
                                    {filteredSubCategories.map((subCategory) => (
                                        <SelectItem key={subCategory.id} value={subCategory.name}>
                                            {subCategory.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Date Range Filter - Nepali Calendar */}
                            <NepaliDateRangePicker
                                value={dateRange}
                                onChange={(range) => {
                                    setDateRange({
                                        from: range?.from,
                                        to: range?.to,
                                    })
                                }}
                                placeholder="Pick a date range"
                                className="w-full md:w-max"
                            />

                            {/* Clear Filters Button */}
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-8 px-2 md:px-3 w-full md:w-auto"
                                >
                                    Clear
                                    <X className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex gap-2 items-center justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <ChevronDown className="h-4 w-4 mr-2" />
                                    Columns
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
                        <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Payment
                        </Button>
                    </div>
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
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
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
                                    className="h-24 text-center"
                                >
                                    No payments found.
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
            <AddPaymentDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onSuccess={fetchData}
            />

            {/* Edit Payment Dialog */}
            <EditPaymentDialog
                isOpen={isEditDialogOpen}
                onClose={() => {
                    setIsEditDialogOpen(false)
                    setEditingPayment(null)
                }}
                onSuccess={(updatedPayment) => {
                    // Update the payment in the local state
                    setPayments((prevPayments) =>
                        prevPayments.map((p) =>
                            p.id === updatedPayment.id ? updatedPayment : p
                        )
                    )
                    setIsEditDialogOpen(false)
                    setEditingPayment(null)
                }}
                payment={editingPayment}
            />
        </div>
    )
}
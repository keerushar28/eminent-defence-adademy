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
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Plus, Trash, X, Loader2, Search, Edit } from "lucide-react";
import { Button } from "@/features/core/components/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/features/core/components/dropdown-menu";
import { Input } from "@/features/core/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/core/components/table";
import { Badge } from "@/features/core/components/badge";
import { useState, useEffect } from "react";
import AddBillModal from "./AddBillModal";
import EditBillModal from "./EditBillModal";
import { deleteBill } from "../../actions/billing-actions";
import { getBillingCategories } from "../../actions/category-actions";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/features/core/components/select";
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker";
import NepaliDate from "nepali-date-converter";
import { IInventoryCategory } from "../../types/inventory-types";
import { useBillingData } from "../hooks/useBillingData";
import Pagination from "@/features/core/components/shared/pagination";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/features/core/components/alert-dialog";


const STAFF_HIDDEN_CATEGORIES = ["Regular Expenditure (A)"];

interface BillListProps {
    isAdmin?: boolean;
}

export default function BillList({ isAdmin = false }: BillListProps) {
    
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingBill, setEditingBill] = useState<any>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [billToDelete, setBillToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [categories, setCategories] = useState<IInventoryCategory[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    // Use the custom hook for billing data
    const {        bills,
        pagination,
        loading,
        error,
        searchQuery,
        setSearchQuery,
        debouncedSearch,
        selectedCategory,
        setSelectedCategory,
        dateRange,
        setDateRange,
        dateFilterType,
        setDateFilterType,
        goToPage,
        changeLimit,
        clearFilters,
        hasActiveFilters,
        refetch,
    } = useBillingData(isAdmin ? undefined : STAFF_HIDDEN_CATEGORIES);

    // Load billing categories
    useEffect(() => {
        const loadCategories = async () => {
            setLoadingCategories(true);
            try {
                const data = await getBillingCategories(isAdmin ? undefined : STAFF_HIDDEN_CATEGORIES);
                setCategories(data);
            } catch (error) {
                console.error("Error loading categories:", error);
            } finally {
                setLoadingCategories(false);
            }
        };

        loadCategories();
    }, []);

    const handleDelete = async (id: string) => {
        setBillToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!billToDelete) return;
        setIsDeleting(true);
        try {
            const result = await deleteBill(billToDelete);
            if (result.success) {
                toast.success("Bill deleted successfully");
                refetch();
            } else {
                toast.error(result.error || "Failed to delete bill");
            }
        } catch (error) {
            toast.error("An error occurred while deleting the bill");
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setBillToDelete(null);
        }
    };

    const handleEdit = (bill: any) => {
        setEditingBill(bill);
        setIsEditOpen(true);
    };

    const baseColumns: ColumnDef<Record<string, unknown>>[] = [
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
            accessorKey: "category.name",
            header: "Category",
            cell: ({ row }) => {
                const category = row.original.category as { name?: string } | undefined;
                return <Badge variant="outline">{category?.name || "Unknown"}</Badge>;
            },
        },
        {
            accessorKey: "billingTitle",
            header: "Billing Title",
            cell: ({ row }) => <div className="font-medium">{row.getValue("billingTitle") || "-"}</div>,
        },
        {
            accessorKey: "periodStartDate",
            header: "Period Start Date",
            cell: ({ row }) => {
                const startDate = new Date(row.original.periodStartDate as string | number | Date);
                const startBS = new NepaliDate(startDate).format("YYYY-MM-DD");
                return <div className="font-medium text-sm">{startBS}</div>;
            },
        },
        {
            accessorKey: "periodEndDate",
            header: "Period End Date",
            cell: ({ row }) => {
                const endDate = new Date(row.original.periodEndDate as string | number | Date);
                const endBS = new NepaliDate(endDate).format("YYYY-MM-DD");
                return <div className="font-medium text-sm">{endBS}</div>;
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
                );
            },
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("amount"));
                return <div className="font-medium">{amount.toFixed(2)}</div>;
            },
        },
        {
            accessorKey: "units",
            header: "Units",
            cell: ({ row }) => {
                const units = row.getValue("units") as number | null;
                return <div>{units ? units : "-"}</div>;
            },
        },
        {
            accessorKey: "billDate",
            header: "Date",
            cell: ({ row }) => {
                const date = new Date(row.getValue("billDate"));
                const bsDate = new NepaliDate(date).format("YYYY-MM-DD");
                return <div className="font-medium">{bsDate}</div>;
            },
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => <div className="truncate max-w-[200px]">{row.getValue("description") || "-"}</div>,
        },
        ...(isAdmin ? [{
            id: "actions",
            cell: ({ row }: { row: { original: Record<string, unknown> } }) => {
                const bill = row.original;
                const billId = bill.id as string;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                                onClick={() => handleEdit(bill)}
                                className="cursor-pointer"
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={() => handleDelete(billId)} 
                                className="text-red-600 cursor-pointer"
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        }] : []),
    ];

    const visibleBills = bills;

    const table = useReactTable({
        data: visibleBills,
        columns: baseColumns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    });

    return (
        <div className="w-full space-y-4">
            {/* Error Message */}
            {error && (
                <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 w-full">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by title or notes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                                disabled={loading}
                            />
                            {searchQuery && debouncedSearch !== searchQuery && (
                                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                            )}
                        </div>

                        {/* Category Filter */}
                        <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={loadingCategories || loading}>
                            <SelectTrigger className="w-full sm:w-[160px] md:w-[180px]">
                                <SelectValue placeholder={loadingCategories ? "Loading..." : "All Categories"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Nepali Date Range Filter */}
                        <NepaliDatePicker
                            mode="range"
                            value={dateRange}
                            onChange={(date) => {
                                if (date && typeof date === 'object' && 'from' in date) {
                                    setDateRange({ from: date.from, to: date.to });
                                }
                            }}
                            placeholder="Date Range"
                            className="w-max"
                            captionLayout="dropdown"
                        />

                        {/* Date Filter Type Selector */}
                        <Select value={dateFilterType} onValueChange={(value) => setDateFilterType(value as "period" | "billDate")} disabled={loading}>
                            <SelectTrigger className="w-full sm:w-[140px] md:w-[160px]">
                                <SelectValue placeholder="Filter by..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="period">Billing Period</SelectItem>
                                <SelectItem value="billDate">Bill Date</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                disabled={loading}
                                className="h-8 px-2 lg:px-3"
                            >
                                Clear
                                <X className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-2 items-center w-full sm:w-auto">
                        {loading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading...
                            </div>
                        )}
                        <Button onClick={() => setIsAddOpen(true)} disabled={loading} className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Bill
                        </Button>
                    </div>
                </div>
            </div>

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
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={baseColumns.length} className="h-24 text-center">
                                    <div className="flex justify-center items-center">
                                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                        Loading...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
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
                                <TableCell colSpan={baseColumns.length} className="h-24 text-center">
                                    No bills found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination.total > 0 && (
                <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={goToPage}
                    onItemsPerPageChange={changeLimit}
                    loading={loading}
                />
            )}

            <AddBillModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={() => {
                    setIsAddOpen(false);
                    refetch();
                }}
                isAdmin={isAdmin}
            />

            <EditBillModal
                isOpen={isEditOpen}
                onClose={() => {
                    setIsEditOpen(false);
                    setEditingBill(null);
                }}
                onSuccess={(updatedBill) => {
                    refetch();
                    setIsEditOpen(false);
                    setEditingBill(null);
                }}
                bill={editingBill}
                isAdmin={isAdmin}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Bill</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this bill? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
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
        </div>
    );
}

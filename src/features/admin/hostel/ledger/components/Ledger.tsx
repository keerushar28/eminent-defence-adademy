"use client";

import { useState, useMemo } from "react";
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
import { Input } from "@/features/core/components/input";
import { Button } from "@/features/core/components/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/features/core/components/select";
import {
    Search,
    X,
    Loader2,
    ChevronDown,
    Eye,
    Bed,
    DoorOpen,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/features/core/components/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/features/core/components/table";
import { Badge } from "@/features/core/components/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/features/core/components/avatar";
import { Skeleton } from "@/features/core/components/skeleton";
import StudentDetailsDialog from "./StudentDetailsDialog";
import HostelSummaryCards from "./HostelSummaryCards";
import Pagination from "@/features/core/components/shared/pagination";
import { useHostelLedgerData } from "../hooks/useHostelLedgerData";
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker";
import { formatCurrency } from "../utils/utils";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import { useIsAdmin } from "../../hooks/useIsAdmin";
import { CategorySubcategoryFilter } from "./CategorySubcategoryFilter";

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
                    <div className="flex items-center gap-3 min-w-[200px]">
                        <Avatar className="h-10 w-10 border border-background shadow-sm shrink-0">
                            <AvatarImage src={student.student_image} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                {student.fullname.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm">{student.fullname}</div>
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
                    <div className="flex flex-col gap-1 min-w-[100px]">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <DoorOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>R{student.roomNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Bed className="h-3 w-3 shrink-0" />
                            <span>B{student.bedNumber}</span>
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
                    <div className="flex justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 text-sm"
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
                    </div>
                );
            },
            cell: ({ row }) => {
                return (
                    <div className="text-right font-medium text-sm min-w-[100px]">
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
                    <div className="flex justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 text-sm"
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
                    </div>
                );
            },
            cell: ({ row }) => {
                const student = row.original;
                return (
                    <div className="text-right min-w-[100px]">
                        <div className="font-medium text-primary text-sm">
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
                    <div className="flex justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 text-sm"
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
                    </div>
                );
            },
            cell: ({ row }) => {
                return (
                    <div className="text-right font-medium text-destructive text-sm min-w-[100px]">
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
                    <div className="text-sm min-w-[120px]">
                        {formatNepaliDateFromDate(new Date(row.getValue("paidUntil")))}
                    </div>
                );
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                return (
                    <div className="min-w-[100px]">
                        {getStatusBadge(row.getValue("status"))}
                    </div>
                );
            },
        },
    ];

    if (isAdmin) {
        baseColumns.push({
            accessorKey: "overpaidAmount",
            header: ({ column }) => {
                const isSorted = column.getIsSorted();
                return (
                    <div className="flex justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 text-sm"
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
                    </div>
                );
            },
            cell: ({ row }) => {
                const amount = row.getValue("overpaidAmount") as number;
                return (
                    <div className="text-right font-medium text-primary text-sm min-w-[100px]">
                        {amount > 0 ? formatCurrency(amount) : "-"}
                    </div>
                );
            },
        });
    }

    baseColumns.push({
        id: "actions",
        enableHiding: false,
        header: () => <div className="text-center text-sm">Actions</div>,
        cell: ({ row }) => {
            return (
                <div className="text-center min-w-[80px]">
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

export default function HostelLedger() {
    const isAdmin = useIsAdmin();
    const [selectedStudent, setSelectedStudent] = useState<HostelLedgerStudent | null>(null);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const {
        students,
        summary,
        pagination,
        loading,
        error,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        roomFilter,
        setRoomFilter,
        categoryFilter,
        setCategoryFilter,
        subcategoryFilter,
        setSubcategoryFilter,
        paymentMethodFilter,
        setPaymentMethodFilter,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        rooms,
        categories,
        subcategories,
        paymentMethods,
        goToPage,
        changeLimit,
        clearFilters,
        hasActiveFilters,
    } = useHostelLedgerData();

    const columns = useMemo(() => createColumns(setSelectedStudent, isAdmin), [isAdmin]);

    const table = useReactTable({
        data: students,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnVisibility,
        },
    });

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

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-destructive text-base">{error}</p>
                </div>
            )}

            {summary && <HostelSummaryCards summary={summary} />}

            <div className=" rounded-lg p-4 border space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">Filters</h3>
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
                    <div className="relative flex-1 min-w-0 w-full">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 text-sm"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-10 text-sm w-full md:w-max">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="FULLY_PAID">Fully Paid</SelectItem>
                            <SelectItem value="PARTIAL">Partial</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="OVERPAID">Overpaid</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={roomFilter} onValueChange={setRoomFilter} >
                        <SelectTrigger className="h-10 text-sm w-full md:w-max">
                            <SelectValue placeholder="All Rooms" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Rooms</SelectItem>
                            {rooms.map((room) => (
                                <SelectItem key={room} value={room}>
                                    Room {room}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <CategorySubcategoryFilter
                        categories={categories}
                        subcategories={subcategories}
                        categoryValue={categoryFilter}
                        subcategoryValue={subcategoryFilter}
                        onCategoryChange={setCategoryFilter}
                        onSubcategoryChange={setSubcategoryFilter}
                    />

                    <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter} >
                        <SelectTrigger className="h-10 text-sm w-full md:w-max">
                            <SelectValue placeholder="All Methods" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Methods</SelectItem>
                            {paymentMethods.map((method) => (
                                <SelectItem key={method} value={method}>
                                    {method.replace("_", " ")}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex gap-3 items-center">
                        <NepaliDatePicker
                            value={startDate}
                            onChange={(date) => setStartDate(date instanceof Date ? date : undefined)}
                            placeholder="From"
                            mode="single"
                        />
                        <span className="text-muted-foreground text-sm">-</span>
                        <NepaliDatePicker
                            value={endDate}
                            onChange={(date) => setEndDate(date instanceof Date ? date : undefined)}
                            placeholder="To"
                            mode="single"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">
                        Hostel Ledger
                        <span className="ml-3 text-sm font-normal text-muted-foreground">
                            ({pagination.total} {pagination.total === 1 ? "student" : "students"})
                        </span>
                    </h2>
                    <div className="flex items-center gap-2">
                        {loading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading...
                            </div>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-10 text-sm">
                                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {table
                                    .getAllColumns()
                                    .filter((column) => column.getCanHide())
                                    .map((column) => (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize text-sm"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-full">
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="bg-muted">
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} className="whitespace-nowrap">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: pagination.limit }).map((_, index) => (
                                    <SkeletonRow key={`skeleton-${index}`} />
                                ))
                            ) : table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id} className="hover:bg-muted/50">
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="whitespace-nowrap">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <Bed className="w-10 h-10" />
                                            <p className="text-sm font-medium">No students found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

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
            </div>

            <StudentDetailsDialog
                student={selectedStudent}
                open={selectedStudent !== null}
                onOpenChange={(open) => !open && setSelectedStudent(null)}
            />
        </div>
    );
}

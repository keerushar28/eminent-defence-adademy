"use client";

import { useState, useMemo } from "react";
import { LedgerStudent, LedgerSummary } from "../actions/ledger-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/core/components/card";
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
    Download,
    Filter,
    X,
    Loader2,
} from "lucide-react";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import LedgerTable from "./LedgerTable";
import StudentDetailsDialog from "./StudentDetailsDialog";
import SummaryCards from "./SummaryCards";
import Pagination from "@/features/core/components/shared/pagination";
import { useLedgerData } from "../hooks/useLedgerData";
import { useSubCategoryFilter } from "@/features/core/hooks/useSubCategoryFilter";

interface StudentLedgerProps {
    initialStudents?: LedgerStudent[];
    initialSummary?: LedgerSummary;
}

export default function StudentLedger({ initialStudents, initialSummary }: StudentLedgerProps) {
    const [selectedStudent, setSelectedStudent] = useState<LedgerStudent | null>(null);

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
        categoryFilter,
        setCategoryFilter,
        subCategoryFilter,
        setSubCategoryFilter,
        paymentMethodFilter,
        setPaymentMethodFilter,
        categories,
        subCategories,
        paymentMethods,
        goToPage,
        changeLimit,
        clearFilters,
        hasActiveFilters,
    } = useLedgerData({ initialStudents, initialSummary });

    // Use the reusable sub category filter hook
    const { filteredSubCategories } = useSubCategoryFilter(subCategories, categoryFilter, categories);

    const handleExport = () => {
        const headers = [
            "Student Name",
            "Email",
            "Total Fee",
            "Total Paid",
            "Discount",
            "Pending",
            "Last Payment Date",
            "Status",
        ];

        const rows = students.map((student) => [
            student.fullname,
            student.email,
            student.totalFee,
            student.totalPaid,
            student.totalDiscount,
            student.pendingAmount,
            student.lastPaymentDate
                ? formatNepaliDateFromDate(new Date(student.lastPaymentDate))
                : "N/A",
            student.status,
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `student-ledger-${formatNepaliDateFromDate(new Date())}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Error Message */}
            {error && (
                <Card className="border-destructive bg-destructive/10">
                    <CardContent className="pt-6">
                        <p className="text-destructive text-sm">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Summary Cards */}
            {summary && <SummaryCards summary={summary} />}

            {/* Filters */}
            <Card className="border shadow-xs">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            <CardTitle>Filters</CardTitle>
                        </div>
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                        {/* Left side - Search and Filters */}
                        <div className="flex flex-col md:flex-row gap-2 md:items-center flex-1 min-w-0">
                            {/* Search */}
                            <div className="relative flex-1 min-w-0 md:max-w-xs">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 border-border w-full"
                                />
                                {loading && (
                                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-2 items-center">
                                <Select
                                    value={statusFilter}
                                    onValueChange={setStatusFilter}
                                >
                                    <SelectTrigger className="border-border w-full md:w-max">
                                        <SelectValue placeholder="Payment Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Status</SelectItem>
                                        <SelectItem value="FULLY_PAID">Fully Paid</SelectItem>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="UNPAID">Unpaid</SelectItem>
                                        <SelectItem value="NO_ALLOCATION">No Allocation</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={categoryFilter}
                                    onValueChange={(value) => {
                                        setCategoryFilter(value);
                                        setSubCategoryFilter("ALL");
                                    }}
                                >
                                    <SelectTrigger className="border-border w-full md:w-max">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Categories</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.name}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={subCategoryFilter}
                                    onValueChange={setSubCategoryFilter}
                                >
                                    <SelectTrigger className="border-border w-full md:w-max">
                                        <SelectValue placeholder="Sub Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Sub Categories</SelectItem>
                                        {filteredSubCategories.map((subCat) => (
                                            <SelectItem key={subCat.id} value={subCat.name}>
                                                {subCat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={paymentMethodFilter}
                                    onValueChange={setPaymentMethodFilter}
                                >
                                    <SelectTrigger className="border-border w-full md:w-max">
                                        <SelectValue placeholder="Payment Method" />
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
                            </div>
                        </div>

                        {/* Right side - Export button */}
                        <Button
                            onClick={handleExport}
                            variant="default"
                            size="sm"
                            className="w-full md:w-auto"
                            disabled={loading || students.length === 0}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Students Table */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                        Student Ledger
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                            ({pagination.total} {pagination.total === 1 ? "student" : "students"})
                        </span>
                    </CardTitle>
                    {loading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading...
                        </div>
                    )}
                </div>

                <LedgerTable
                    students={students}
                    onViewDetails={setSelectedStudent}
                    loading={loading}
                    itemsPerPage={pagination.limit}
                />

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
            </div>

            {/* Student Details Dialog */}
            <StudentDetailsDialog
                student={selectedStudent}
                open={selectedStudent !== null}
                onOpenChange={(open) => !open && setSelectedStudent(null)}
            />
        </div>
    );
}

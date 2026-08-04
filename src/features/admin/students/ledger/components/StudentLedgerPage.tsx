"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/core/components/card";
import { Button } from "@/features/core/components/button";
import { Input } from "@/features/core/components/input";
import { Badge } from "@/features/core/components/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/features/core/components/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/features/core/components/avatar";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/features/core/components/sheet";
import { ScrollArea } from "@/features/core/components/scroll-area";
import { Separator } from "@/features/core/components/separator";
import {
  Loader2, Search, Plus, Eye, Users, AlertCircle, CheckCircle,
  Clock, RefreshCw, Wallet, SlidersHorizontal, X,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  getUnifiedLedgerData, getLedgerFilterOptions,
  UnifiedStudentLedger, UnifiedLedgerSummary, LedgerFilterOptions,
} from "../actions/unified-ledger-actions";
import Pagination from "@/features/core/components/shared/pagination";
import UnifiedPaymentDialog from "./UnifiedPaymentDialog";
import StudentLedgerDetailDialog from "./StudentLedgerDetailDialog";

// ─── Filter state ────────────────────────────────────────────────────────────

interface Filters {
  search: string;
  // Payment status chips
  paymentStatus: Set<string>;       // FULLY_PAID | PENDING | UNPAID | NO_ALLOCATION
  // Pending type chips
  pendingTypes: Set<string>;        // category | hostel | issuance
  // Hostel allocation chips
  hostelStatus: Set<string>;        // active | deallocated | none
  // Category assignment chips
  categoryStatus: Set<string>;      // assigned | not_assigned
  // Specific category / subcategory / room IDs
  categoryIds: Set<string>;
  subCategoryIds: Set<string>;
  roomIds: Set<string>;
}

const emptyFilters = (): Filters => ({
  search: "",
  paymentStatus: new Set(),
  pendingTypes: new Set(),
  hostelStatus: new Set(),
  categoryStatus: new Set(),
  categoryIds: new Set(),
  subCategoryIds: new Set(),
  roomIds: new Set(),
});

function toggleSet(s: Set<string>, v: string): Set<string> {
  const n = new Set(s);
  n.has(v) ? n.delete(v) : n.add(v);
  return n;
}

function countFilters(f: Filters) {
  return (
    f.paymentStatus.size +
    f.pendingTypes.size +
    f.hostelStatus.size +
    f.categoryStatus.size +
    f.categoryIds.size +
    f.subCategoryIds.size +
    f.roomIds.size
  );
}

// ─── Chip component ──────────────────────────────────────────────────────────

function FilterChip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{children}</p>;
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function StudentLedgerPage() {
  const { data: session } = useSession();
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role ?? "");

  const [students, setStudents] = useState<UnifiedStudentLedger[]>([]);
  const [summary, setSummary] = useState<UnifiedLedgerSummary | null>(null);
  const [filterOptions, setFilterOptions] = useState<LedgerFilterOptions>({ categories: [], subCategories: [], rooms: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(emptyFilters());
  const [filterOpen, setFilterOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Payment dialog
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentStudentId, setPaymentStudentId] = useState("");

  // Detail dialog
  const [selectedStudent, setSelectedStudent] = useState<UnifiedStudentLedger | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [data, opts] = await Promise.all([getUnifiedLedgerData(), getLedgerFilterOptions()]);
      setStudents(data.students);
      setSummary(data.summary);
      setFilterOptions(opts);
    } catch {
      toast.error("Failed to load ledger data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── helpers ──
  const set = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    setFilters(f => ({ ...f, [key]: val }));

  const toggle = (key: "paymentStatus" | "pendingTypes" | "hostelStatus" | "categoryStatus" | "categoryIds" | "subCategoryIds" | "roomIds", val: string) =>
    setFilters(f => ({ ...f, [key]: toggleSet(f[key], val) }));

  const resetFilters = () => setFilters(emptyFilters());

  const activeCount = countFilters(filters);

  // ── filtering ──
  const filteredStudents = useMemo(() => {
    const f = filters;
    return students.filter(s => {
      // search
      if (f.search && !s.fullname.toLowerCase().includes(f.search.toLowerCase()) &&
          !s.email.toLowerCase().includes(f.search.toLowerCase())) return false;

      // payment status (OR within group)
      if (f.paymentStatus.size > 0 && !f.paymentStatus.has(s.status)) return false;

      // pending types (AND — student must have ALL selected pending types)
      if (f.pendingTypes.has("category") && s.categoryPending <= 0) return false;
      if (f.pendingTypes.has("hostel") && s.hostelPending <= 0) return false;
      if (f.pendingTypes.has("issuance") && s.issuancePending <= 0) return false;

      // hostel status (OR within group)
      if (f.hostelStatus.size > 0) {
        const match =
          (f.hostelStatus.has("active") && s.hasActiveHostel) ||
          (f.hostelStatus.has("deallocated") && s.hasDeallocatedHostel) ||
          (f.hostelStatus.has("none") && !s.hasActiveHostel && !s.hasDeallocatedHostel);
        if (!match) return false;
      }

      // category assignment (OR within group)
      if (f.categoryStatus.size > 0) {
        const match =
          (f.categoryStatus.has("assigned") && s.hasCategoryAssignment) ||
          (f.categoryStatus.has("not_assigned") && !s.hasCategoryAssignment);
        if (!match) return false;
      }

      // specific category IDs (OR — student must be in at least one selected)
      if (f.categoryIds.size > 0 && !s.categoryIds.some(id => f.categoryIds.has(id))) return false;

      // specific subcategory IDs (OR)
      if (f.subCategoryIds.size > 0 && !s.subCategoryIds.some(id => f.subCategoryIds.has(id))) return false;

      // specific room IDs (OR)
      if (f.roomIds.size > 0 && !s.roomIds.some(id => f.roomIds.has(id))) return false;

      return true;
    });
  }, [students, filters]);

  useEffect(() => { setCurrentPage(1); }, [filters]);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const formatCurrency = (n: number) =>
    `NPR ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      FULLY_PAID: "bg-green-100 text-green-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      UNPAID: "bg-red-100 text-red-800",
      NO_ALLOCATION: "bg-gray-100 text-gray-600",
    };
    const labels: Record<string, string> = {
      FULLY_PAID: "Fully Paid", PENDING: "Pending", UNPAID: "Unpaid", NO_ALLOCATION: "No Allocation",
    };
    return <Badge className={`${map[status] ?? ""} hover:${map[status] ?? ""}`}>{labels[status] ?? status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Student Ledger</h1>
          <p className="text-muted-foreground text-sm">View and manage all student fees and payments</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {isAdmin && summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { icon: <Users className="h-3 w-3" />, label: "Total", value: summary.totalStudents, color: "" },
            { icon: <CheckCircle className="h-3 w-3 text-green-600" />, label: "Fully Paid", value: summary.fullyPaid, color: "text-green-600" },
            { icon: <Clock className="h-3 w-3 text-yellow-600" />, label: "Pending", value: summary.pending, color: "text-yellow-600" },
            { icon: <AlertCircle className="h-3 w-3 text-red-600" />, label: "Unpaid", value: summary.unpaid, color: "text-red-600" },
            { icon: <Wallet className="h-3 w-3 text-green-600" />, label: "Collected", value: formatCurrency(summary.totalFeesCollected), color: "text-green-600", small: true },
            { icon: <Wallet className="h-3 w-3 text-red-600" />, label: "Due", value: formatCurrency(summary.totalPendingFees), color: "text-red-600", small: true },
          ].map((c, i) => (
            <Card key={i}>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  {c.icon} {c.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className={`font-bold ${c.color} ${c.small ? "text-sm" : "text-2xl"}`}>{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search + Filter trigger */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={e => set("search", e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={activeCount > 0 ? "default" : "outline"}
          size="default"
          onClick={() => setFilterOpen(true)}
          className="gap-2 shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="bg-primary-foreground text-primary rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </Button>
        {activeCount > 0 && (
          <Button variant="ghost" size="default" onClick={resetFilters} className="gap-1 text-muted-foreground shrink-0">
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {/* Active filter chips summary */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {[...filters.paymentStatus].map(v => (
            <Badge key={v} variant="secondary" className="gap-1 cursor-pointer text-xs" onClick={() => toggle("paymentStatus", v)}>
              {v.replace("_", " ")} <X className="h-3 w-3" />
            </Badge>
          ))}
          {[...filters.pendingTypes].map(v => (
            <Badge key={v} variant="secondary" className="gap-1 cursor-pointer text-xs" onClick={() => toggle("pendingTypes", v)}>
              {v} pending <X className="h-3 w-3" />
            </Badge>
          ))}
          {[...filters.hostelStatus].map(v => (
            <Badge key={v} variant="secondary" className="gap-1 cursor-pointer text-xs" onClick={() => toggle("hostelStatus", v)}>
              hostel: {v} <X className="h-3 w-3" />
            </Badge>
          ))}
          {[...filters.categoryStatus].map(v => (
            <Badge key={v} variant="secondary" className="gap-1 cursor-pointer text-xs" onClick={() => toggle("categoryStatus", v)}>
              {v.replace("_", " ")} <X className="h-3 w-3" />
            </Badge>
          ))}
          {[...filters.categoryIds].map(id => {
            const opt = filterOptions.categories.find(c => c.id === id);
            return opt ? (
              <Badge key={id} variant="secondary" className="gap-1 cursor-pointer text-xs" onClick={() => toggle("categoryIds", id)}>
                {opt.label} <X className="h-3 w-3" />
              </Badge>
            ) : null;
          })}
          {[...filters.subCategoryIds].map(id => {
            const opt = filterOptions.subCategories.find(c => c.id === id);
            return opt ? (
              <Badge key={id} variant="secondary" className="gap-1 cursor-pointer text-xs" onClick={() => toggle("subCategoryIds", id)}>
                {opt.parentLabel} › {opt.label} <X className="h-3 w-3" />
              </Badge>
            ) : null;
          })}
          {[...filters.roomIds].map(id => {
            const opt = filterOptions.rooms.find(r => r.id === id);
            return opt ? (
              <Badge key={id} variant="secondary" className="gap-1 cursor-pointer text-xs" onClick={() => toggle("roomIds", id)}>
                {opt.label} <X className="h-3 w-3" />
              </Badge>
            ) : null;
          })}
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filteredStudents.length} of {students.length} students
      </p>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="text-center">
                  <div className="text-xs">Category</div>
                  <div className="flex justify-center gap-1 text-[10px] font-normal text-muted-foreground">
                    <span className="text-green-600">Paid</span><span>/</span><span className="text-red-600">Due</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="text-xs">Issuance</div>
                  <div className="flex justify-center gap-1 text-[10px] font-normal text-muted-foreground">
                    <span className="text-green-600">Paid</span><span>/</span><span className="text-red-600">Due</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="text-xs">Hostel</div>
                  <div className="flex justify-center gap-1 text-[10px] font-normal text-muted-foreground">
                    <span className="text-green-600">Paid</span><span>/</span><span className="text-red-600">Due</span>
                    {isAdmin && <><span>/</span><span className="text-blue-600">Credit</span></>}
                  </div>
                </TableHead>
                <TableHead className="text-right text-green-700 text-xs">Total Paid</TableHead>
                <TableHead className="text-right text-red-700 text-xs">Total Due</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    No students match the current filters
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStudents.map((student, index) => (
                  <TableRow key={student.id} className="hover:bg-muted/20">
                    <TableCell className="text-center font-medium text-sm">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.student_image} alt={student.fullname} />
                          <AvatarFallback>{student.fullname.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{student.fullname}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1 text-xs">
                        <span className="text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">
                          {student.categoryTotalPaid > 0 ? formatCurrency(student.categoryTotalPaid) : "-"}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className={`font-medium px-1.5 py-0.5 rounded ${student.categoryPending > 0 ? "text-red-600 bg-red-50" : "text-muted-foreground"}`}>
                          {student.categoryPending > 0 ? formatCurrency(student.categoryPending) : "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1 text-xs">
                        <span className="text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">
                          {student.issuanceTotalPaid > 0 ? formatCurrency(student.issuanceTotalPaid) : "-"}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className={`font-medium px-1.5 py-0.5 rounded ${student.issuancePending > 0 ? "text-red-600 bg-red-50" : "text-muted-foreground"}`}>
                          {student.issuancePending > 0 ? formatCurrency(student.issuancePending) : "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1 text-xs">
                        <span className="text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">
                          {student.hostelTotalPaid > 0 ? formatCurrency(student.hostelTotalPaid) : "-"}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className={`font-medium px-1.5 py-0.5 rounded ${student.hostelPending > 0 ? "text-red-600 bg-red-50" : "text-muted-foreground"}`}>
                          {student.hostelPending > 0 ? formatCurrency(student.hostelPending) : "-"}
                        </span>
                        {isAdmin && student.hostelCredit > 0 && (
                          <>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">
                              +{formatCurrency(student.hostelCredit)}
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-green-600 bg-green-50 px-2 py-1 rounded text-xs">
                        {formatCurrency(student.grandTotalPaid)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold px-2 py-1 rounded text-xs ${student.grandTotalPending > 0 ? "text-red-600 bg-red-50" : "text-muted-foreground"}`}>
                        {student.grandTotalPending > 0 ? formatCurrency(student.grandTotalPending) : "-"}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedStudent(student); setIsDetailOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="default" size="sm" onClick={() => { setPaymentStudentId(student.id); setIsPaymentOpen(true); }}>
                          <Plus className="h-4 w-4 mr-1" />Pay
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {filteredStudents.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredStudents.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={limit => { setItemsPerPage(limit); setCurrentPage(1); }}
            loading={loading}
          />
        )}
      </Card>

      {/* ── Filter Sheet ─────────────────────────────────────────────────── */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b flex-row items-center justify-between">
            <SheetTitle className="text-base">Filters</SheetTitle>
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs h-7 gap-1 text-muted-foreground">
                <X className="h-3 w-3" /> Clear all
              </Button>
            )}
          </SheetHeader>

          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-5">

              {/* Payment Status */}
              <div>
                <SectionLabel>Payment Status</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {[
                    { v: "FULLY_PAID", label: "Fully Paid" },
                    { v: "PENDING", label: "Pending" },
                    { v: "UNPAID", label: "Unpaid" },
                    { v: "NO_ALLOCATION", label: "No Allocation" },
                  ].map(({ v, label }) => (
                    <FilterChip
                      key={v}
                      label={label}
                      active={filters.paymentStatus.has(v)}
                      onClick={() => toggle("paymentStatus", v)}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              {/* Pending Fees */}
              <div>
                <SectionLabel>Has Pending Fees In</SectionLabel>
                <p className="text-[11px] text-muted-foreground mb-2">Select one or more — student must have pending in all selected</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { v: "category", label: "Category" },
                    { v: "hostel", label: "Hostel" },
                    { v: "issuance", label: "Inventory" },
                  ].map(({ v, label }) => (
                    <FilterChip
                      key={v}
                      label={label}
                      active={filters.pendingTypes.has(v)}
                      onClick={() => toggle("pendingTypes", v)}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              {/* Hostel Allocation */}
              <div>
                <SectionLabel>Hostel Allocation</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {[
                    { v: "active", label: "Currently Allocated" },
                    { v: "deallocated", label: "Deallocated" },
                    { v: "none", label: "Never Allocated" },
                  ].map(({ v, label }) => (
                    <FilterChip
                      key={v}
                      label={label}
                      active={filters.hostelStatus.has(v)}
                      onClick={() => toggle("hostelStatus", v)}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              {/* Category Assignment */}
              <div>
                <SectionLabel>Category Assignment</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {[
                    { v: "assigned", label: "Has Category" },
                    { v: "not_assigned", label: "No Category" },
                  ].map(({ v, label }) => (
                    <FilterChip
                      key={v}
                      label={label}
                      active={filters.categoryStatus.has(v)}
                      onClick={() => toggle("categoryStatus", v)}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              {/* Categories */}
              {filterOptions.categories.length > 0 && (
                <div>
                  <SectionLabel>Category</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.categories.map(c => (
                      <FilterChip
                        key={c.id}
                        label={c.label}
                        active={filters.categoryIds.has(c.id)}
                        onClick={() => toggle("categoryIds", c.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-categories grouped by parent */}
              {filterOptions.categories.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <SectionLabel>Sub-Category</SectionLabel>
                    <div className="space-y-3">
                      {filterOptions.categories.map(cat => {
                        const subs = filterOptions.subCategories.filter(sc => sc.parentLabel === cat.label);
                        if (subs.length === 0) return null;
                        return (
                          <div key={cat.id}>
                            <p className="text-[11px] text-muted-foreground mb-1.5">{cat.label}</p>
                            <div className="flex flex-wrap gap-2">
                              {subs.map(sc => (
                                <FilterChip
                                  key={sc.id}
                                  label={sc.label}
                                  active={filters.subCategoryIds.has(sc.id)}
                                  onClick={() => toggle("subCategoryIds", sc.id)}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Hostel Rooms */}
              {filterOptions.rooms.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <SectionLabel>Hostel Room</SectionLabel>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.rooms.map(r => (
                        <FilterChip
                          key={r.id}
                          label={r.label}
                          active={filters.roomIds.has(r.id)}
                          onClick={() => toggle("roomIds", r.id)}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

            </div>
          </ScrollArea>

          <div className="border-t px-4 py-3 flex justify-between items-center">
            <p className="text-xs text-muted-foreground">{filteredStudents.length} students match</p>
            <Button size="sm" onClick={() => setFilterOpen(false)}>Done</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Dialog */}
      {selectedStudent && (
        <StudentLedgerDetailDialog
          isOpen={isDetailOpen}
          onClose={() => { setIsDetailOpen(false); setSelectedStudent(null); }}
          studentId={selectedStudent.id}
          onAddPayment={() => {
            setIsDetailOpen(false);
            setPaymentStudentId(selectedStudent.id);
            setIsPaymentOpen(true);
          }}
        />
      )}

      {/* Payment Dialog */}
      <UnifiedPaymentDialog
        isOpen={isPaymentOpen}
        onClose={() => { setIsPaymentOpen(false); setPaymentStudentId(""); }}
        onSuccess={() => { setIsPaymentOpen(false); setPaymentStudentId(""); fetchData(); }}
        studentId={paymentStudentId}
      />
    </div>
  );
}

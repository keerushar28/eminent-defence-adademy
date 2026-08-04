"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus, Search, Trash2, MoreHorizontal, Loader2, X } from "lucide-react";import { Button } from "@/features/core/components/button";
import { Input } from "@/features/core/components/input";
import { Badge } from "@/features/core/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/core/components/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/features/core/components/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/core/components/select";
import { toast } from "sonner";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import { getAllIssuancePayments, deleteIssuancePayment } from "../actions/issuance-payment-actions";
import AddIssuancePaymentSheet from "./AddIssuancePaymentSheet";
import { Skeleton } from "@/features/core/components/skeleton";

interface IssuancePaymentRow {
  id: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  issuance: {
    id: string;
    quantity: number;
    unitPrice: number | null;
    student: { id: string; fullname: string; email: string } | null;
    item: { id: string; name: string; unit: string; category: { name: string } | null } | null;
  };
}

const paymentMethodColors: Record<string, string> = {
  CASH: "bg-green-100 text-green-800",
  BANK_TRANSFER: "bg-blue-100 text-blue-800",
  CHEQUE: "bg-purple-100 text-purple-800",
  ONLINE: "bg-orange-100 text-orange-800",
  CARD: "bg-pink-100 text-pink-800",
};

const paymentMethodLabels: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  CHEQUE: "Cheque",
  ONLINE: "Online",
  CARD: "Card",
};

export default function IssuancePaymentsDataTable() {
  const [payments, setPayments] = useState<IssuancePaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IssuancePaymentRow | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllIssuancePayments({
        search: search || undefined,
        paymentMethod: methodFilter !== "all" ? methodFilter : undefined,
      });
      setPayments(data as IssuancePaymentRow[]);
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [search, methodFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleAddPayment = () => {
    setIsAddOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const result = await deleteIssuancePayment(deleteTarget.id);
      if (result.success) {
        toast.success("Payment deleted successfully");
        setPayments((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      } else {
        toast.error(result.error || "Failed to delete payment");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const columns: ColumnDef<IssuancePaymentRow>[] = [
    {
      id: "serial",
      header: "#",
      cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.index + 1}</div>,
    },
    {
      accessorKey: "paymentDate",
      header: "Payment Date",
      cell: ({ row }) => (
        <div className="font-medium">
          {formatNepaliDateFromDate(new Date(row.getValue("paymentDate")))}
        </div>
      ),
    },
    {
      id: "student",
      header: "Student",
      cell: ({ row }) => {
        const student = row.original.issuance?.student;
        return student ? (
          <div>
            <p className="font-medium">{student.fullname}</p>
            <p className="text-xs text-muted-foreground">{student.email}</p>
          </div>
        ) : <span className="text-muted-foreground">-</span>;
      },
    },
    {
      id: "item",
      header: "Item",
      cell: ({ row }) => {
        const item = row.original.issuance?.item;
        return item ? (
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.category?.name}</p>
          </div>
        ) : <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <div className="font-semibold text-green-600">
          NPR {(row.getValue("amount") as number).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: "Method",
      cell: ({ row }) => {
        const method = row.getValue("paymentMethod") as string;
        return (
          <Badge className={paymentMethodColors[method] || ""}>
            {paymentMethodLabels[method] || method}
          </Badge>
        );
      },
    },
    {
      accessorKey: "referenceNumber",
      header: "Reference",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.getValue("referenceNumber") || <span className="text-muted-foreground">-</span>}
        </span>
      ),
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => {
        const notes = row.getValue("notes") as string | null;
        return notes
          ? <p className="text-sm truncate max-w-xs" title={notes}>{notes}</p>
          : <span className="text-muted-foreground">-</span>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setDeleteTarget(row.original)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Payment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: payments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const hasFilters = search || methodFilter !== "all";

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              <SelectItem value="CHEQUE">Cheque</SelectItem>
              <SelectItem value="ONLINE">Online</SelectItem>
              <SelectItem value="CARD">Card</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(""); setMethodFilter("all"); }}
            >
              Clear <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <Button onClick={handleAddPayment} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Issuance Payment
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No payments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Payment Sheet */}
      <AddIssuancePaymentSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {
          setIsAddOpen(false);
          fetchPayments();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment of NPR {deleteTarget?.amount.toLocaleString()}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!!deletingId}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingId ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

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
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
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
import { useState } from "react";
import { IStudentIssuance, IssuanceStatus } from "../types/inventory-types";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import EmptyState from "../components/shared/EmptyState";
import { ClipboardList } from "lucide-react";
import IssuanceDetailsDialog from "./IssuanceDetailsDialog";
import DeleteIssuanceDialog from "./DeleteIssuanceDialog";
import EditIssuanceSheet from "./EditIssuanceSheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/features/core/components/collapsible";
import {
  getDeletedIssuances,
  restoreIssuance,
  permanentDeleteIssuance,
} from "../actions/issuance-actions";
import TableSkeleton from "../components/shared/TableSkeleton";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface IssuanceListProps {
  issuances?: IStudentIssuance[];
  onIssueClick?: () => void;
}

// Helper function to get status badge variant
function getStatusBadgeVariant(status: IssuanceStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ISSUED":
      return "secondary";
    case "PARTIALLY_RETURNED":
      return "outline";
    case "RETURNED":
      return "default";
    default:
      return "secondary";
  }
}

// Helper function to format status text
function formatStatus(status: IssuanceStatus): string {
  switch (status) {
    case "ISSUED":
      return "Issued";
    case "PARTIALLY_RETURNED":
      return "Partially Returned";
    case "RETURNED":
      return "Returned";
    default:
      return status;
  }
}

export default function IssuanceList({ issuances = [], onIssueClick }: IssuanceListProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [selectedIssuance, setSelectedIssuance] = useState<IStudentIssuance | null>(null);
  const [editingIssuance, setEditingIssuance] = useState<IStudentIssuance | null>(null);
  const [deletingIssuance, setDeletingIssuance] = useState<IStudentIssuance | null>(null);

  // Trash state
  const [deletedIssuances, setDeletedIssuances] = useState<IStudentIssuance[]>([]);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isLoadingTrash, setIsLoadingTrash] = useState(false);
  const [restoringIssuance, setRestoringIssuance] = useState<IStudentIssuance | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [permanentlyDeletingIssuance, setPermanentlyDeletingIssuance] = useState<IStudentIssuance | null>(null);
  const [isPermanentDeleting, setIsPermanentDeleting] = useState(false);

  // Trash handlers
  const loadDeletedIssuances = async () => {
    setIsLoadingTrash(true);
    try {
      const deleted = await getDeletedIssuances();
      setDeletedIssuances(deleted);
    } catch (error) {
      console.error("Error loading deleted issuances:", error);
      toast.error("Failed to load deleted issuances");
    } finally {
      setIsTrashOpen(true);
      setIsLoadingTrash(false);
    }
  };

  const handleRestore = async () => {
    if (!restoringIssuance) return;
    setIsRestoring(true);
    try {
      const result = await restoreIssuance(restoringIssuance.id);
      if (result.success) {
        toast.success("Issuance Restored", {
          description: `Issuance has been restored successfully.`,
        });
        setRestoringIssuance(null);
        loadDeletedIssuances();
        router.refresh();
      } else {
        toast.error("Failed to Restore Issuance", {
          description: result.error || "Something went wrong.",
        });
      }
    } catch (error) {
      console.error("Error restoring issuance:", error);
      toast.error("Error", { description: "An unexpected error occurred." });
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!permanentlyDeletingIssuance) return;
    setIsPermanentDeleting(true);
    try {
      const result = await permanentDeleteIssuance(permanentlyDeletingIssuance.id);
      if (result.success) {
        toast.success("Issuance Permanently Deleted", {
          description: `Issuance has been permanently deleted.`,
        });
        setPermanentlyDeletingIssuance(null);
        loadDeletedIssuances();
      } else {
        toast.error("Failed to Delete Issuance", {
          description: result.error || "Something went wrong.",
        });
      }
    } catch (error) {
      console.error("Error permanently deleting issuance:", error);
      toast.error("Error", { description: "An unexpected error occurred." });
    } finally {
      setIsPermanentDeleting(false);
    }
  };

  const columns: ColumnDef<IStudentIssuance>[] = [
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
      accessorKey: "student",
      header: "Student",
      cell: ({ row }) => {
        const student = row.original.student;
        if (!student) return <div>-</div>;

        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={student.student_image} alt={student.fullname} />
              <AvatarFallback>{student.fullname.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="font-medium">{student.fullname}</div>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const student = row.original.student;
        if (!student) return false;
        return student.fullname.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      accessorKey: "item",
      header: "Item",
      cell: ({ row }) => {
        const item = row.original.item;
        return (
          <div>
            <div className="font-medium">{item?.name || "-"}</div>
            <div className="text-sm text-muted-foreground">{item?.category?.name || ""}</div>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const item = row.original.item;
        if (!item) return false;
        return item.name.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Quantity
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const quantity = row.getValue("quantity") as number;
        const unit = row.original.item?.unit || "";
        return <div>{quantity} {unit}</div>;
      },
    },
    {
      accessorKey: "unitPrice",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Unit Price
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const unitPrice = row.getValue("unitPrice") as number;
        return <div>NPR {(unitPrice || 0).toFixed(2)}</div>;
      },
    },
    {
      accessorKey: "returnedQty",
      header: "Returned",
      cell: ({ row }) => {
        const returnedQty = row.getValue("returnedQty") as number;
        const unit = row.original.item?.unit || "";
        return <div>{returnedQty} {unit}</div>;
      },
    },
    {
      accessorKey: "issuedDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Issued Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("issuedDate") as Date;
        return <div>{formatNepaliDateFromDate(new Date(date))}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as IssuanceStatus;
        return (
          <Badge variant={getStatusBadgeVariant(status)}>
            {formatStatus(status)}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        if (value === "all") return true;
        return row.getValue(id) === value;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const issuance = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedIssuance(issuance)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditingIssuance(issuance)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeletingIssuance(issuance)}
                className="text-red-600 focus:text-red-600"
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

  const table = useReactTable({
    data: issuances,
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
  });

  // Show empty state if no issuances
  if (issuances.length === 0) {
    return (
      <div className="w-full">
        {onIssueClick && (
          <div className="flex items-center justify-end mb-4">
            <Button onClick={onIssueClick}>
              <Plus className="mr-2 h-4 w-4" />
              Issue to Student
            </Button>
          </div>
        )}
        <div className="rounded-md border">
          <EmptyState
            icon={ClipboardList}
            title="No issuances found"
            description="Issue items to students and track what has been distributed. You can also manage returns when students return items."
            actionLabel={onIssueClick ? "Issue Your First Item" : undefined}
            onAction={onIssueClick}
          />
        </div>

        {/* Trash Section even when list is empty */}
        <Collapsible
          open={isTrashOpen}
          onOpenChange={(open) => {
            setIsTrashOpen(open);
            if (open && deletedIssuances.length === 0) {
              loadDeletedIssuances();
            }
          }}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between mt-4 border-t pt-4">
              <span className="text-muted-foreground">
                Recently Deleted {deletedIssuances.length > 0 && `(${deletedIssuances.length})`}
              </span>
              {isTrashOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {isLoadingTrash ? (
              <div className="mt-2">
                <TableSkeleton rows={3} columns={5} />
              </div>
            ) : deletedIssuances.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No deleted issuances found.
              </div>
            ) : (
              <TrashTable
                items={deletedIssuances}
                onRestore={setRestoringIssuance}
                onPermanentDelete={setPermanentlyDeletingIssuance}
              />
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Dialogs */}
        <DeleteIssuanceDialog
          issuance={deletingIssuance}
          open={!!deletingIssuance}
          onOpenChange={(open) => !open && setDeletingIssuance(null)}
          onSuccess={() => {
            setDeletingIssuance(null);
            router.refresh();
          }}
        />
        {editingIssuance && (
          <EditIssuanceSheet
            issuance={editingIssuance}
            isOpen={!!editingIssuance}
            onClose={() => setEditingIssuance(null)}
            onSuccess={() => {
              setEditingIssuance(null);
              router.refresh();
            }}
          />
        )}
        <RestoreAlertDialog
          open={!!restoringIssuance}
          onOpenChange={() => setRestoringIssuance(null)}
          onConfirm={handleRestore}
          isProcessing={isRestoring}
        />
        <PermanentDeleteAlertDialog
          open={!!permanentlyDeletingIssuance}
          onOpenChange={() => setPermanentlyDeletingIssuance(null)}
          onConfirm={handlePermanentDelete}
          isProcessing={isPermanentDeleting}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by student..."
            value={(table.getColumn("student")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("student")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Input
            placeholder="Search by item..."
            value={(table.getColumn("item")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("item")?.setFilterValue(event.target.value)
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
              <DropdownMenuItem onClick={() => table.getColumn("status")?.setFilterValue("all")}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn("status")?.setFilterValue("ISSUED")}>
                Issued
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn("status")?.setFilterValue("PARTIALLY_RETURNED")}>
                Partially Returned
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn("status")?.setFilterValue("RETURNED")}>
                Returned
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
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {onIssueClick && (
            <Button onClick={onIssueClick}>
              <Plus className="mr-2 h-4 w-4" />
              Issue to Student
            </Button>
          )}
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
                  No issuances found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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

      {/* Issuance Details Dialog */}
      <IssuanceDetailsDialog
        issuance={selectedIssuance}
        open={!!selectedIssuance}
        onOpenChange={(open) => !open && setSelectedIssuance(null)}
      />

      {/* Edit Issuance Sheet */}
      {editingIssuance && (
        <EditIssuanceSheet
          issuance={editingIssuance}
          isOpen={!!editingIssuance}
          onClose={() => setEditingIssuance(null)}
          onSuccess={() => {
            setEditingIssuance(null);
            router.refresh();
          }}
        />
      )}

      {/* Delete Issuance Dialog */}
      <DeleteIssuanceDialog
        issuance={deletingIssuance}
        open={!!deletingIssuance}
        onOpenChange={(open) => !open && setDeletingIssuance(null)}
        onSuccess={() => {
          setDeletingIssuance(null);
          router.refresh();
          if (isTrashOpen) loadDeletedIssuances();
        }}
      />

      {/* Recently Deleted Section */}
      <Collapsible
        open={isTrashOpen}
        onOpenChange={(open) => {
          setIsTrashOpen(open);
          if (open && deletedIssuances.length === 0) {
            loadDeletedIssuances();
          }
        }}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between mt-4 border-t pt-4">
            <span className="text-muted-foreground">
              Recently Deleted {deletedIssuances.length > 0 && `(${deletedIssuances.length})`}
            </span>
            {isTrashOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {isLoadingTrash ? (
            <div className="mt-2">
              <TableSkeleton rows={3} columns={5} />
            </div>
          ) : deletedIssuances.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No deleted issuances found.
            </div>
          ) : (
            <TrashTable
              items={deletedIssuances}
              onRestore={setRestoringIssuance}
              onPermanentDelete={setPermanentlyDeletingIssuance}
            />
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Restore AlertDialog */}
      <RestoreAlertDialog
        open={!!restoringIssuance}
        onOpenChange={() => setRestoringIssuance(null)}
        onConfirm={handleRestore}
        isProcessing={isRestoring}
      />

      {/* Permanent Delete AlertDialog */}
      <PermanentDeleteAlertDialog
        open={!!permanentlyDeletingIssuance}
        onOpenChange={() => setPermanentlyDeletingIssuance(null)}
        onConfirm={handlePermanentDelete}
        isProcessing={isPermanentDeleting}
      />
    </div>
  );
}

// Trash Table Sub-component
function TrashTable({
  items,
  onRestore,
  onPermanentDelete,
}: {
  items: IStudentIssuance[];
  onRestore: (item: IStudentIssuance) => void;
  onPermanentDelete: (item: IStudentIssuance) => void;
}) {
  return (
    <div className="rounded-md border mt-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Deleted On</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {item.student?.fullname || "-"}
              </TableCell>
              <TableCell>{item.item?.name || "-"}</TableCell>
              <TableCell>{item.quantity} {item.item?.unit || ""}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(item.status)}>
                  {formatStatus(item.status)}
                </Badge>
              </TableCell>
              <TableCell>
                {item.deletedAt
                  ? new Date(item.deletedAt).toLocaleDateString()
                  : "-"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRestore(item)}
                  >
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    Restore
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => onPermanentDelete(item)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Restore AlertDialog
function RestoreAlertDialog({
  open,
  onOpenChange,
  onConfirm,
  isProcessing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isProcessing: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-blue-500" />
            Restore Issuance?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to restore this issuance?
            <br /><br />
            This issuance will be moved back to the active list and will be available for editing and returns.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Restoring...
              </>
            ) : (
              "Restore Issuance"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Permanent Delete AlertDialog
function PermanentDeleteAlertDialog({
  open,
  onOpenChange,
  onConfirm,
  isProcessing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isProcessing: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Permanently Delete?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to{" "}
            <span className="font-bold text-red-600">permanently delete</span> this issuance?
            <br /><br />
            <span className="text-destructive font-medium">
              This action cannot be undone. The issuance and all its data will be permanently removed from the database.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isProcessing}
            className="bg-red-600 hover:bg-red-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Permanently Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

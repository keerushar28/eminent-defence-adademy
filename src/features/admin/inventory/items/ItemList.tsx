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
  Edit,
  Eye,
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
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IInventoryItem,
  IInventoryCategory,
} from "../types/inventory-types";
import AddItem from "./AddItem";
import EditItem from "./EditItem";
import DeleteItemDialog from "./DeleteItemDialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/features/core/components/collapsible";
import {
  getDeletedItems,
  restoreItem,
  permanentDeleteItem,
} from "../actions/item-actions";
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

interface ItemListProps {
  items?: IInventoryItem[];
  categories?: IInventoryCategory[];
}

export default function ItemList({
  items = [],
  categories = [],
}: ItemListProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    {}
  );
  const [rowSelection, setRowSelection] = useState({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IInventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<IInventoryItem | null>(
    null
  );

  // Trash state
  const [deletedItems, setDeletedItems] = useState<IInventoryItem[]>([]);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isLoadingTrash, setIsLoadingTrash] = useState(false);
  const [restoringItem, setRestoringItem] = useState<IInventoryItem | null>(
    null
  );
  const [isRestoring, setIsRestoring] = useState(false);
  const [
    permanentlyDeletingItem,
    setPermanentlyDeletingItem,
  ] = useState<IInventoryItem | null>(null);
  const [isPermanentDeleting, setIsPermanentDeleting] = useState(false);

  const getStockStatus = (item: IInventoryItem) => {
    if (item.currentStock === 0) {
      return {
        label: "Out of Stock",
        variant: "destructive" as const,
        showWarning: true,
      };
    }
    if (item.currentStock <= item.minStockThreshold * 0.25) {
      return {
        label: "Critical",
        variant: "destructive" as const,
        showWarning: true,
      };
    }
    if (item.currentStock <= item.minStockThreshold) {
      return {
        label: "Low Stock",
        variant: "secondary" as const,
        showWarning: true,
      };
    }
    return {
      label: "In Stock",
      variant: "default" as const,
      showWarning: false,
    };
  };

  // Trash handlers
  const loadDeletedItems = async () => {
    setIsLoadingTrash(true);
    try {
      const deleted = await getDeletedItems();
      setDeletedItems(deleted);
    } catch (error) {
      console.error("Error loading deleted items:", error);
      toast.error("Failed to load deleted items");
    } finally {
      setIsTrashOpen(true);
      setIsLoadingTrash(false);
    }
  };

  const handleRestore = async () => {
    if (!restoringItem) return;
    setIsRestoring(true);
    try {
      const result = await restoreItem(restoringItem.id);
      if (result.success) {
        toast.success("Item Restored", {
          description: `Item "${restoringItem.name}" has been restored successfully.`,
        });
        setRestoringItem(null);
        loadDeletedItems();
        router.refresh();
      } else {
        toast.error("Failed to Restore Item", {
          description: result.error || "Something went wrong.",
        });
      }
    } catch (error) {
      console.error("Error restoring item:", error);
      toast.error("Error", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!permanentlyDeletingItem) return;
    setIsPermanentDeleting(true);
    try {
      const result = await permanentDeleteItem(permanentlyDeletingItem.id);
      if (result.success) {
        toast.success("Item Permanently Deleted", {
          description: `Item "${permanentlyDeletingItem.name}" has been permanently deleted.`,
        });
        setPermanentlyDeletingItem(null);
        loadDeletedItems();
      } else {
        toast.error("Failed to Delete Item", {
          description: result.error || "Something went wrong.",
        });
      }
    } catch (error) {
      console.error("Error permanently deleting item:", error);
      toast.error("Error", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsPermanentDeleting(false);
    }
  };

  const columns: ColumnDef<IInventoryItem>[] = [
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
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Item Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const stockStatus = getStockStatus(row.original);
        return (
          <div className="flex items-center gap-2">
            {stockStatus.showWarning && (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
            <span className="font-medium">{row.getValue("name")}</span>
          </div>
        );
      },
      enableColumnFilter: true,
      filterFn: "includesString",
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue("sku")}</div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.original.category;
        return <div>{category?.name || "-"}</div>;
      },
      filterFn: (row, id, value) => {
        if (value === "all") return true;
        return row.original.categoryId === value;
      },
    },
    {
      accessorKey: "currentStock",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Stock
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const item = row.original;
        const stockStatus = getStockStatus(item);
        return (
          <div className="flex items-center gap-2">
            <span>
              {item.currentStock} {item.unit}
            </span>
            <Badge variant={stockStatus.variant} className="text-xs">
              {stockStatus.label}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "minStockThreshold",
      header: "Min. Threshold",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div>
            {item.minStockThreshold} {item.unit}
          </div>
        );
      },
    },
    {
      accessorKey: "unitPrice",
      header: "Unit Price",
      cell: ({ row }) => {
        const price = row.getValue("unitPrice") as number | null;
        return <div>{price ? `${price.toFixed(2)}` : "-"}</div>;
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        if (value === "all") return true;
        if (value === "active") return row.getValue(id) === true;
        if (value === "inactive") return row.getValue(id) === false;
        return true;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original;

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
                onClick={() =>
                  router.push(`/admin/inventory/items/${item.id}`)
                }
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditingItem(item)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeletingItem(item)}
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
    data: items,
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

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search items..."
            value={
              (table.getColumn("name")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Filter Category <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() =>
                  table.getColumn("category")?.setFilterValue("all")
                }
              >
                All Categories
              </DropdownMenuItem>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  onClick={() =>
                    table.getColumn("category")?.setFilterValue(category.id)
                  }
                >
                  {category.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Filter Status <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() =>
                  table.getColumn("isActive")?.setFilterValue("all")
                }
              >
                All
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  table.getColumn("isActive")?.setFilterValue("active")
                }
              >
                Active
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  table.getColumn("isActive")?.setFilterValue("inactive")
                }
              >
                Inactive
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
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
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
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
                  No items found.
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

      {/* Add Item Dialog */}
      <AddItem
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {
          setIsAddOpen(false);
          router.refresh();
        }}
        categories={categories}
      />

      {/* Edit Item Sheet */}
      {editingItem && (
        <EditItem
          item={editingItem}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={() => {
            setEditingItem(null);
            router.refresh();
          }}
          categories={categories}
        />
      )}

      {/* Delete Item Dialog */}
      <DeleteItemDialog
        item={deletingItem}
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        onSuccess={() => {
          setDeletingItem(null);
          router.refresh();
          if (isTrashOpen) loadDeletedItems();
        }}
      />

      {/* Recently Deleted Section */}
      <Collapsible
        open={isTrashOpen}
        onOpenChange={(open) => {
          setIsTrashOpen(open);
          if (open && deletedItems.length === 0) {
            loadDeletedItems();
          }
        }}
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between mt-4 border-t pt-4"
          >
            <span className="text-muted-foreground">
              Recently Deleted{" "}
              {deletedItems.length > 0 && `(${deletedItems.length})`}
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
          ) : deletedItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No deleted items found.
            </div>
          ) : (
            <div className="rounded-md border mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Deleted On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedItems.map((deletedItem) => (
                    <TableRow key={deletedItem.id}>
                      <TableCell className="font-medium">
                        {deletedItem.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {deletedItem.sku}
                      </TableCell>
                      <TableCell>{deletedItem.category?.name || "-"}</TableCell>
                      <TableCell>
                        {deletedItem.deletedAt
                          ? new Date(
                              deletedItem.deletedAt
                            ).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRestoringItem(deletedItem)}
                          >
                            <RotateCcw className="mr-2 h-3.5 w-3.5" />
                            Restore
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() =>
                              setPermanentlyDeletingItem(deletedItem)
                            }
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
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Restore Item AlertDialog */}
      <AlertDialog
        open={!!restoringItem}
        onOpenChange={() => setRestoringItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-blue-500" />
              Restore Item?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore{" "}
              <strong>{restoringItem?.name}</strong>?
              <br />
              <br />
              This item will be moved back to the active inventory list and
              will be available for stock transactions and orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={isRestoring}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                "Restore Item"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete AlertDialog */}
      <AlertDialog
        open={!!permanentlyDeletingItem}
        onOpenChange={() => setPermanentlyDeletingItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Permanently Delete?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              <span className="font-bold text-red-600">
                permanently delete
              </span>{" "}
              <strong>{permanentlyDeletingItem?.name}</strong>?
              <br />
              <br />
              <span className="text-destructive font-medium">
                This action cannot be undone. The item and all its data will be
                permanently removed from the database.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPermanentDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              disabled={isPermanentDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPermanentDeleting ? (
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
    </div>
  );
}

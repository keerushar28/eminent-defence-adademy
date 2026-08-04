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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus, Eye, Pencil, Trash2, RotateCcw, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/core/components/table";
import { Badge } from "@/features/core/components/badge";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IOrder, OrderStatus } from "../types/inventory-types";
import CreateOrder from "./CreateOrder";
import EditOrder from "./EditOrder";
import OrderDetailsDialog from "./OrderDetailsDialog";
import DeleteOrderDialog from "./DeleteOrderDialog";
import EmptyState from "../components/shared/EmptyState";
import TableSkeleton from "../components/shared/TableSkeleton";
import { ShoppingCart } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/features/core/components/collapsible";
import { getDeletedOrders, restoreOrder, permanentDeleteOrder } from "../actions/order-actions";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
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
import { receiveOrder } from "../actions/order-actions";
import { toast } from "sonner";

interface OrderListProps {
  orders?: IOrder[];
}

// Helper function to get status badge variant
function getStatusBadgeVariant(status: OrderStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "PENDING":
      return "secondary";
    case "PARTIALLY_RECEIVED":
      return "outline";
    case "RECEIVED":
      return "default";
    case "CANCELLED":
      return "destructive";
    default:
      return "secondary";
  }
}

// Helper function to format status text
function formatStatus(status: OrderStatus): string {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "PARTIALLY_RECEIVED":
      return "Partially Received";
    case "RECEIVED":
      return "Received";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

export default function OrderList({ orders = [] }: OrderListProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState<IOrder | null>(null);
  const [isReceiving, setIsReceiving] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<IOrder | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<IOrder | null>(null);
  const [deletedOrders, setDeletedOrders] = useState<IOrder[]>([]);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isLoadingTrash, setIsLoadingTrash] = useState(false);
  const [restoringOrder, setRestoringOrder] = useState<IOrder | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [permanentlyDeletingOrder, setPermanentlyDeletingOrder] = useState<IOrder | null>(null);
  const [isPermanentDeleting, setIsPermanentDeleting] = useState(false);

  const columns: ColumnDef<IOrder>[] = [
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
      accessorKey: "orderNumber",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Order Number
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("orderNumber")}</div>,
      enableColumnFilter: true,
      filterFn: "includesString",
    },
    {
      accessorKey: "vendor",
      header: "Vendor",
      cell: ({ row }) => {
        const vendor = row.original.vendor;
        return <div>{vendor?.name || "-"}</div>;
      },
    },
    {
      accessorKey: "orderDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Order Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("orderDate") as Date;
        const dateObj = new Date(date);
        return (
          <div className="space-y-1">
            <div className="font-medium text-sm">{formatNepaliDateFromDate(dateObj)}</div>
            <div className="text-xs text-muted-foreground">{dateObj.toLocaleDateString()}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const amount = row.getValue("totalAmount") as number;
        return <div className="font-medium">NPR {amount.toFixed(2)}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as OrderStatus;
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
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => {
        const items = row.original.items || [];
        return <div>{items.length} item(s)</div>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const order = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {(order.status === "PENDING" || order.status === "PARTIALLY_RECEIVED") && (
                <DropdownMenuItem onClick={() => setEditingOrder(order)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {order.status === "PENDING" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeletingOrder(order)}
                    className="text-red-600 cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const loadDeletedOrders = async () => {
    setIsLoadingTrash(true);
    try {
      const orders = await getDeletedOrders();
      setDeletedOrders(orders);
    } catch (error) {
      console.error("Error loading deleted orders:", error);
      toast.error("Failed to load deleted orders");
    } finally {
      setIsTrashOpen(true);
      setIsLoadingTrash(false);
    }
  };

  const handleRestore = async () => {
    if (!restoringOrder) return;
    setIsRestoring(true);
    try {
      const result = await restoreOrder(restoringOrder.id);
      if (result.success) {
        toast.success("Order Restored", {
          description: `Order ${restoringOrder.orderNumber} has been restored successfully.`,
        });
        setRestoringOrder(null);
        loadDeletedOrders();
        router.refresh();
      } else {
        toast.error("Failed to Restore Order", {
          description: result.error || "Something went wrong.",
        });
      }
    } catch (error) {
      console.error("Error restoring order:", error);
      toast.error("Error", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!permanentlyDeletingOrder) return;
    setIsPermanentDeleting(true);
    try {
      const result = await permanentDeleteOrder(permanentlyDeletingOrder.id);
      if (result.success) {
        toast.success("Order Permanently Deleted", {
          description: `Order ${permanentlyDeletingOrder.orderNumber} has been permanently deleted.`,
        });
        setPermanentlyDeletingOrder(null);
        loadDeletedOrders();
      } else {
        toast.error("Failed to Delete Order", {
          description: result.error || "Something went wrong.",
        });
      }
    } catch (error) {
      console.error("Error permanently deleting order:", error);
      toast.error("Error", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsPermanentDeleting(false);
    }
  };

  const table = useReactTable({
    data: orders,
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

  // Show empty state if no orders
  if (orders.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-end mb-4">
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        </div>
        <div className="rounded-md border">
          <EmptyState
            icon={ShoppingCart}
            title="No orders found"
            description="Create purchase orders to track items ordered from vendors. You can manage order status and receive items when they arrive."
            actionLabel="Create Your First Order"
            onAction={() => setIsCreateOpen(true)}
          />
        </div>
        <CreateOrder
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search orders..."
            value={(table.getColumn("orderNumber")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("orderNumber")?.setFilterValue(event.target.value)
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
              <DropdownMenuItem onClick={() => table.getColumn("status")?.setFilterValue("PENDING")}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn("status")?.setFilterValue("PARTIALLY_RECEIVED")}>
                Partially Received
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn("status")?.setFilterValue("RECEIVED")}>
                Received
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn("status")?.setFilterValue("CANCELLED")}>
                Cancelled
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
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Order
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
                  No orders found.
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

      <CreateOrder
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          router.refresh();
        }}
      />

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      />

      {/* Receive Order Alert Dialog */}
      <AlertDialog open={!!receivingOrder} onOpenChange={() => setReceivingOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Receive Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark order <strong>{receivingOrder?.orderNumber}</strong> as fully received?
              <br /><br />
              This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Update all items to fully received status</li>
                <li>Add the quantities to your inventory stock</li>
                <li>Mark the order as completed</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReceiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!receivingOrder) return;
                
                setIsReceiving(true);
                try {
                  const formData = new FormData();
                  formData.append("items", JSON.stringify(
                    receivingOrder.items?.map(item => ({
                      orderItemId: item.id,
                      receivedQty: item.quantity - item.receivedQty,
                    })) || []
                  ));
                  
                  const result = await receiveOrder(receivingOrder.id, formData);

                  if (result.success) {
                    toast.success("Order Received Successfully! 📦", {
                      description: `Order ${receivingOrder.orderNumber} has been marked as received.`,
                    });
                    setReceivingOrder(null);
                    router.refresh();
                  } else {
                    toast.error("Failed to Receive Order", {
                      description: result.error || "Something went wrong.",
                    });
                  }
                } catch (error) {
                  console.error("Error receiving order:", error);
                  toast.error("Error", {
                    description: "An unexpected error occurred.",
                  });
                } finally {
                  setIsReceiving(false);
                }
              }}
              disabled={isReceiving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isReceiving ? "Receiving..." : "Receive Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Order Sheet */}
      {editingOrder && (
        <EditOrder
          order={editingOrder}
          isOpen={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          onSuccess={() => {
            setEditingOrder(null);
            router.refresh();
          }}
        />
      )}

      {/* Delete Order Dialog */}
      <DeleteOrderDialog
        order={deletingOrder}
        open={!!deletingOrder}
        onOpenChange={(open) => !open && setDeletingOrder(null)}
        onSuccess={() => {
          setDeletingOrder(null);
          router.refresh();
          if (isTrashOpen) loadDeletedOrders();
        }}
      />

      {/* Recently Deleted Section */}
      <Collapsible
        open={isTrashOpen}
        onOpenChange={(open) => {
          setIsTrashOpen(open);
          if (open && deletedOrders.length === 0) {
            loadDeletedOrders();
          }
        }}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between mt-4 border-t pt-4">
            <span className="text-muted-foreground">
              Recently Deleted {deletedOrders.length > 0 && `(${deletedOrders.length})`}
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
          ) : deletedOrders.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No deleted orders found.
            </div>
          ) : (
            <div className="rounded-md border mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Deleted On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedOrders.map((deletedOrder) => (
                    <TableRow key={deletedOrder.id}>
                      <TableCell className="font-medium">
                        {deletedOrder.orderNumber}
                      </TableCell>
                      <TableCell>{deletedOrder.vendor?.name || "-"}</TableCell>
                      <TableCell>NPR {Number(deletedOrder.totalAmount).toFixed(2)}</TableCell>
                      <TableCell>
                        {deletedOrder.deletedAt
                          ? formatNepaliDateFromDate(new Date(deletedOrder.deletedAt))
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRestoringOrder(deletedOrder)}
                          >
                            <RotateCcw className="mr-2 h-3.5 w-3.5" />
                            Restore
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setPermanentlyDeletingOrder(deletedOrder)}
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

      {/* Restore Order AlertDialog */}
      <AlertDialog open={!!restoringOrder} onOpenChange={() => setRestoringOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-blue-500" />
              Restore Order?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore order <strong>{restoringOrder?.orderNumber}</strong>?
              <br /><br />
              This order will be moved back to the active orders list and will be available for editing and receiving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
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
                "Restore Order"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete AlertDialog */}
      <AlertDialog open={!!permanentlyDeletingOrder} onOpenChange={() => setPermanentlyDeletingOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Permanently Delete?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to <span className="font-bold text-red-600">permanently delete</span> order <strong>{permanentlyDeletingOrder?.orderNumber}</strong>?
              <br /><br />
              <span className="text-destructive font-medium">
                This action cannot be undone. The order and all its data will be permanently removed from the database.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPermanentDeleting}>Cancel</AlertDialogCancel>
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

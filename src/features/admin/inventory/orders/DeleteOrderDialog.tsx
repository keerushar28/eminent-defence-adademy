"use client";

import { IOrder } from "../types/inventory-types";
import { deleteOrder } from "../actions/order-actions";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
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

interface DeleteOrderDialogProps {
  order: IOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function DeleteOrderDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: DeleteOrderDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!order) return null;

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteOrder(order.id);

      if (result.success) {
        toast.success("Order Moved to Trash", {
          description: `Order ${order.orderNumber} has been moved to trash.`,
          duration: 5000,
        });

        onOpenChange(false);
        onSuccess();
      } else {
        toast.error("Failed to Delete Order", {
          description: result.error || "Something went wrong. Please try again.",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Error", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Move to Trash?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to move order <strong>{order.orderNumber}</strong> to trash?
            <br /><br />
            This order can be restored from the trash section later if needed.
            <br /><br />
            <span className="text-muted-foreground text-xs">
              Note: This order is currently in <strong>{order.status.replace(/_/g, " ").toLowerCase()}</strong> status.
              Only pending orders can be deleted.
            </span>
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Moving to trash...
              </>
            ) : (
              "Move to Trash"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

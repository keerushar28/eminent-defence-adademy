"use client";

import { Button } from "@/features/core/components/button";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/features/core/components/sheet";
import { Input } from "@/features/core/components/input";
import { toast } from "sonner";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { receiveOrder } from "../actions/order-actions";
import { IOrder } from "../types/inventory-types";
import { Badge } from "@/features/core/components/badge";

const receiveOrderItemSchema = z.object({
  orderItemId: z.string(),
  receivedQuantity: z.number().min(0, "Received quantity must be 0 or greater"),
});

const receiveOrderFormSchema = z.object({
  items: z.array(receiveOrderItemSchema),
});

type ReceiveOrderFormData = z.infer<typeof receiveOrderFormSchema>;

interface ReceiveOrderProps {
  order: IOrder;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReceiveOrder({ order, isOpen, onClose, onSuccess }: ReceiveOrderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with order items
  const defaultValues: ReceiveOrderFormData = {
    items: order.items?.map((item) => ({
      orderItemId: item.id,
      receivedQuantity: Math.max(0, item.quantity - item.receivedQty), // Default to remaining quantity
    })) || [],
  };

  const form = useForm<ReceiveOrderFormData>({
    resolver: zodResolver(receiveOrderFormSchema),
    defaultValues,
  });

  const handleSubmit = async (values: ReceiveOrderFormData) => {
    if (isSubmitting) return;

    // Validate that at least one item has received quantity > 0
    const hasReceivedItems = values.items.some((item) => item.receivedQuantity > 0);
    if (!hasReceivedItems) {
      toast.error("No Items Received", {
        description: "Please enter received quantity for at least one item.",
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("items", JSON.stringify(values.items));

      // Get current user ID (you may need to adjust this based on your auth setup)
      const receivedBy = "current-user-id"; // TODO: Get from session

      const result = await receiveOrder(order.id, formData, receivedBy);

      if (result.success) {
        toast.success("Order Received Successfully! 🎉", {
          description: result.message || "Order has been received.",
          duration: 5000,
        });

        form.reset();
        onSuccess();
      } else {
        toast.error("Failed to Receive Order ❌", {
          description: result.error || "Something went wrong. Please try again.",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Submission Error ❌", {
        description: "An unexpected error occurred. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onClose();
  };

  // Helper to set all items to full quantity
  const handleReceiveAll = () => {
    order.items?.forEach((item, index) => {
      const remaining = item.quantity - item.receivedQty;
      form.setValue(`items.${index}.receivedQuantity`, remaining);
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl gap-0 pb-2 p-6 h-full font-medium overflow-y-auto">
        <SheetHeader className="mb-2 p-0 border-b pb-4 gap-0.5">
          <SheetTitle className="text-xl">Receive Order</SheetTitle>
          <SheetDescription className="text-sm font-normal">
            Enter the received quantities for each item. Order: {order.orderNumber}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
          {/* Quick Action */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReceiveAll}
              disabled={isSubmitting}
            >
              Receive All Remaining
            </Button>
          </div>

          {/* Order Items */}
          <div className="space-y-4">
            {order.items?.map((orderItem, index) => {
              const remaining = orderItem.quantity - orderItem.receivedQty;
              const isFullyReceived = remaining === 0;

              return (
                <div
                  key={orderItem.id}
                  className={`border rounded-lg p-4 space-y-3 ${
                    isFullyReceived ? "bg-muted/50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium">{orderItem.item?.name || "N/A"}</h4>
                      <p className="text-xs text-muted-foreground">
                        SKU: {orderItem.item?.sku || "N/A"} | Category:{" "}
                        {orderItem.item?.category?.name || "N/A"}
                      </p>
                    </div>
                    {isFullyReceived && (
                      <Badge variant="default" className="text-xs">
                        Fully Received
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Ordered</p>
                      <p className="font-medium">{orderItem.quantity}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Already Received</p>
                      <p className="font-medium">{orderItem.receivedQty}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Remaining</p>
                      <p className="font-medium">{remaining}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">
                      Receive Quantity
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max={remaining}
                      placeholder="0"
                      {...form.register(`items.${index}.receivedQuantity`, {
                        valueAsNumber: true,
                      })}
                      disabled={isSubmitting || isFullyReceived}
                    />
                    {form.formState.errors.items?.[index]?.receivedQuantity && (
                      <p className="text-red-500 text-xs mt-1">
                        {form.formState.errors.items[index]?.receivedQuantity?.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum: {remaining} {orderItem.item?.unit || "units"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="border-t pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Items:</span>
                <span className="font-medium">{order.items?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Receiving Now:</span>
                <span className="font-medium">
                  {form.watch("items")?.filter((item) => item.receivedQuantity > 0).length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Receiving...
                </>
              ) : (
                "Receive Order"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

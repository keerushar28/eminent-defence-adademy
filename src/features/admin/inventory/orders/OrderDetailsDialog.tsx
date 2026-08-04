"use client";

import { IOrder } from "../types/inventory-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/features/core/components/dialog";
import { Badge } from "@/features/core/components/badge";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import { Package, Calendar, Truck } from "lucide-react";

interface OrderDetailsDialogProps {
  order: IOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getStatusVariant(status: string): "default" | "secondary" | "outline" {
  switch (status) {
    case "PENDING":
    case "PARTIALLY_RECEIVED":
      return "secondary";
    case "RECEIVED":
      return "default";
    case "CANCELLED":
      return "outline";
    default:
      return "secondary";
  }
}

export default function OrderDetailsDialog({
  order,
  open,
  onOpenChange,
}: OrderDetailsDialogProps) {
  if (!order) return null;

  const orderDate = new Date(order.orderDate);
  const expectedDelivery = order.expectedDelivery ? new Date(order.expectedDelivery) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 space-y-3">
          <div className="space-y-1">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              {order.orderNumber}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {order.vendor?.name || "Unknown Vendor"}
            </p>
          </div>
          <Badge variant={getStatusVariant(order.status)} className="w-fit">
            {order.status === "PENDING" && "Pending"}
            {order.status === "PARTIALLY_RECEIVED" && "Partially Received"}
            {order.status === "RECEIVED" && "Received"}
            {order.status === "CANCELLED" && "Cancelled"}
          </Badge>
        </DialogHeader>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="px-6 pb-6 space-y-6">
            {/* Info Grid */}
            <div className="grid grid-cols-3 gap-4 py-4 border-y">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Order Date</span>
                </div>
                <p className="text-sm font-medium">
                  {formatNepaliDateFromDate(orderDate)}
                </p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Package className="h-3.5 w-3.5" />
                  <span>Total Amount</span>
                </div>
                <p className="text-sm font-medium">
                  NPR {Number(order.totalAmount).toLocaleString()}
                </p>
              </div>

              {expectedDelivery && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Truck className="h-3.5 w-3.5" />
                    <span>Expected Delivery</span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatNepaliDateFromDate(expectedDelivery)}
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Notes
                </p>
                <p className="text-sm leading-relaxed">{order.notes}</p>
              </div>
            )}

            {/* Items */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">
                Items ({order.items?.length || 0})
              </h3>
              
              <div className="rounded-lg border divide-y">
                {order.items?.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium mb-0.5">
                          {item.item?.name || "Unknown Item"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.item?.category?.name}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-8 text-sm tabular-nums">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-0.5">Qty</p>
                          <p className="font-medium">{item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-0.5">Unit Price</p>
                          <p className="font-medium">NPR {Number(item.unitPrice).toLocaleString()}</p>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <p className="text-xs text-muted-foreground mb-0.5">Total</p>
                          <p className="font-semibold">
                            NPR {(item.quantity * Number(item.unitPrice)).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
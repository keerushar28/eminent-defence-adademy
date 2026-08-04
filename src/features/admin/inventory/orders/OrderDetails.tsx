"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/features/core/components/card";
import { Badge } from "@/features/core/components/badge";
import { Button } from "@/features/core/components/button";
import { Separator } from "@/features/core/components/separator";
import { IOrder, OrderStatus } from "../types/inventory-types";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import { Package, Calendar, User, FileText, Truck } from "lucide-react";
import { useState } from "react";
import ReceiveOrder from "./ReceiveOrder";
import { useRouter } from "next/navigation";

interface OrderDetailsProps {
  order: IOrder;
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

export default function OrderDetails({ order }: OrderDetailsProps) {
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const router = useRouter();

  const canReceive = order.status === "PENDING" || order.status === "PARTIALLY_RECEIVED";

  const handleUpdate = () => {
    setIsReceiveOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{order.orderNumber}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Order Details
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(order.status)} className="text-sm">
                {formatStatus(order.status)}
              </Badge>
              {canReceive && (
                <Button onClick={() => setIsReceiveOpen(true)}>
                  <Truck className="mr-2 h-4 w-4" />
                  Receive Order
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Vendor</p>
                <p className="text-sm text-muted-foreground">{order.vendor?.name || "N/A"}</p>
                {order.vendor?.phone && (
                  <p className="text-xs text-muted-foreground">{order.vendor.phone}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Order Date</p>
                <p className="text-sm text-muted-foreground">
                  {formatNepaliDateFromDate(new Date(order.orderDate))}
                </p>
              </div>
            </div>

            {order.expectedDelivery && (
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Expected Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    {formatNepaliDateFromDate(new Date(order.expectedDelivery))}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Created By</p>
                <p className="text-sm text-muted-foreground">{order.createdBy}</p>
              </div>
            </div>

            {order.receivedBy && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Received By</p>
                  <p className="text-sm text-muted-foreground">{order.receivedBy}</p>
                  {order.receivedAt && (
                    <p className="text-xs text-muted-foreground">
                      {formatNepaliDateFromDate(new Date(order.receivedAt))}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {order.notes && (
            <>
              <Separator />
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items && order.items.length > 0 ? (
              <>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left text-sm font-medium">Item</th>
                        <th className="p-3 text-left text-sm font-medium">SKU</th>
                        <th className="p-3 text-right text-sm font-medium">Quantity</th>
                        <th className="p-3 text-right text-sm font-medium">Received</th>
                        <th className="p-3 text-right text-sm font-medium">Unit Price</th>
                        <th className="p-3 text-right text-sm font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((orderItem) => {
                        const subtotal = orderItem.quantity * orderItem.unitPrice;
                        const isFullyReceived = orderItem.receivedQty >= orderItem.quantity;
                        const isPartiallyReceived = orderItem.receivedQty > 0 && !isFullyReceived;

                        return (
                          <tr key={orderItem.id} className="border-b last:border-0">
                            <td className="p-3">
                              <div>
                                <p className="text-sm font-medium">{orderItem.item?.name || "N/A"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {orderItem.item?.category?.name || ""}
                                </p>
                              </div>
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {orderItem.item?.sku || "N/A"}
                            </td>
                            <td className="p-3 text-right text-sm">{orderItem.quantity}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-sm">{orderItem.receivedQty}</span>
                                {isFullyReceived && (
                                  <Badge variant="default" className="text-xs">Full</Badge>
                                )}
                                {isPartiallyReceived && (
                                  <Badge variant="outline" className="text-xs">Partial</Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-right text-sm">
                              NPR {orderItem.unitPrice.toFixed(2)}
                            </td>
                            <td className="p-3 text-right text-sm font-medium">
                              NPR {subtotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <div className="space-y-2 min-w-[200px]">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Amount:</span>
                      <span>NPR {order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No items in this order.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Receive Order Dialog */}
      {canReceive && (
        <ReceiveOrder
          order={order}
          isOpen={isReceiveOpen}
          onClose={() => setIsReceiveOpen(false)}
          onSuccess={handleUpdate}
        />
      )}
    </div>
  );
}

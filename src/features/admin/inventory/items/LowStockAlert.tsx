"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/core/components/card";
import { Badge } from "@/features/core/components/badge";
import { Button } from "@/features/core/components/button";
import { AlertTriangle, Package, Eye } from "lucide-react";
import { IInventoryItem } from "../types/inventory-types";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/core/components/table";

interface LowStockAlertProps {
  items: IInventoryItem[];
}

export default function LowStockAlert({ items }: LowStockAlertProps) {
  const router = useRouter();

  const getStockStatus = (item: IInventoryItem) => {
    if (item.currentStock === 0) {
      return { label: "Out of Stock", variant: "destructive" as const, severity: "critical" };
    }
    if (item.currentStock <= item.minStockThreshold * 0.25) {
      return { label: "Critical", variant: "destructive" as const, severity: "critical" };
    }
    if (item.currentStock <= item.minStockThreshold) {
      return { label: "Low Stock", variant: "secondary" as const, severity: "warning" };
    }
    return { label: "In Stock", variant: "default" as const, severity: "normal" };
  };

  const getStockPercentage = (item: IInventoryItem) => {
    if (item.minStockThreshold === 0) return 0;
    return (item.currentStock / item.minStockThreshold) * 100;
  };

  const criticalItems = items.filter((item) => item.currentStock === 0 || item.currentStock <= item.minStockThreshold * 0.25);
  const lowStockItems = items.filter((item) => item.currentStock > item.minStockThreshold * 0.25 && item.currentStock <= item.minStockThreshold);

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Low Stock Alerts
          </CardTitle>
          <CardDescription>Items that need restocking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">All items are adequately stocked</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>
              {criticalItems.length} critical, {lowStockItems.length} low stock items
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/inventory/items")}>
            View All Items
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min. Threshold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const stockStatus = getStockStatus(item);
                const stockPercentage = getStockPercentage(item);

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {stockStatus.severity === "critical" && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.sku}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{item.category?.name || "-"}</TableCell>
                    <TableCell>
                      <span className={stockStatus.severity === "critical" ? "text-destructive font-medium" : ""}>
                        {item.currentStock} {item.unit}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.minStockThreshold} {item.unit}
                    </TableCell>
                    <TableCell>
                      <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              stockPercentage === 0
                                ? "bg-red-600"
                                : stockPercentage <= 25
                                ? "bg-red-500"
                                : stockPercentage <= 100
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{stockPercentage.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/inventory/items/${item.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {criticalItems.length > 0 && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Critical Stock Alert</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {criticalItems.length} item{criticalItems.length > 1 ? "s are" : " is"} critically low or out of
                  stock. Immediate restocking is recommended.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

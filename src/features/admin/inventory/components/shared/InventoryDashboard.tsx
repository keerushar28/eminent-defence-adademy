"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/core/components/card";
import { Button } from "@/features/core/components/button";
import { Badge } from "@/features/core/components/badge";
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  Eye,
  Plus,
  ArrowRight,
  Wallet,
} from "lucide-react";
import { DashboardStats } from "../../types/inventory-types";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/core/components/table";
import { formatDistanceToNow } from "date-fns";

interface InventoryDashboardProps {
  stats: DashboardStats;
}

export default function InventoryDashboard({ stats }: InventoryDashboardProps) {
  const router = useRouter();

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "STOCK_IN":
        return "text-green-600";
      case "STOCK_OUT":
        return "text-red-600";
      case "ADJUSTMENT":
        return "text-blue-600";
      case "RETURN":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "STOCK_IN":
        return "Stock In";
      case "STOCK_OUT":
        return "Stock Out";
      case "ADJUSTMENT":
        return "Adjustment";
      case "RETURN":
        return "Return";
      default:
        return type;
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "PARTIALLY_RECEIVED":
        return "default";
      case "RECEIVED":
        return "default";
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStockStatus = (currentStock: number, minThreshold: number) => {
    if (currentStock === 0) {
      return { label: "Out of Stock", variant: "destructive" as const };
    }
    if (currentStock <= minThreshold * 0.25) {
      return { label: "Critical", variant: "destructive" as const };
    }
    if (currentStock <= minThreshold) {
      return { label: "Low Stock", variant: "secondary" as const };
    }
    return { label: "In Stock", variant: "default" as const };
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">Active inventory items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Items need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Issuances</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentIssuances}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Current inventory value</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common inventory management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push("/admin/inventory/items")}
            >
              <Package className="mr-2 h-4 w-4" />
              Manage Items
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push("/admin/inventory/orders")}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Create Order
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push("/admin/inventory/issuances")}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Issue to Student
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push("/admin/inventory/vendors")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Low Stock Alerts
                </CardTitle>
                <CardDescription>Items that need immediate attention</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin/inventory/items")}
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.lowStockItems.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">All items are adequately stocked</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.lowStockItems.slice(0, 5).map((item) => {
                  const stockStatus = getStockStatus(item.currentStock, item.minStockThreshold);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => router.push(`/admin/inventory/items/${item.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.sku}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {item.currentStock} / {item.minStockThreshold} {item.unit}
                        </span>
                        <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Pending Orders
                </CardTitle>
                <CardDescription>Orders awaiting delivery</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin/inventory/orders")}
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.pendingOrdersList.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pending orders</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.pendingOrdersList.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => router.push(`/admin/inventory/orders/${order.id}`)}
                  >
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.vendor?.name} • {order.items?.length || 0} items
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">NRP {order.totalAmount.toFixed(2)}</span>
                      <Badge variant={getOrderStatusColor(order.status)}>
                        {order.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest stock movements</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/inventory/transactions")}
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats.recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No recent transactions</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.item?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.item?.category?.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={getTransactionTypeColor(transaction.transactionType)}>
                          {getTransactionTypeLabel(transaction.transactionType)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            transaction.transactionType === "STOCK_IN" ||
                              transaction.transactionType === "RETURN"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {transaction.transactionType === "STOCK_IN" ||
                            transaction.transactionType === "RETURN"
                            ? "+"
                            : "-"}
                          {transaction.quantity} {transaction.item?.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        {transaction.balanceAfter} {transaction.item?.unit}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(transaction.transactionDate), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/inventory/items/${transaction.itemId}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

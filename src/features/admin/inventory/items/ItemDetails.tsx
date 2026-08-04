"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/core/components/card";
import { Badge } from "@/features/core/components/badge";
import { Button } from "@/features/core/components/button";
import { Edit, Package, Tag, Ruler, AlertTriangle, Wallet } from "lucide-react";
import { IInventoryItem } from "../types/inventory-types";
import { useState } from "react";
import EditItem from "./EditItem";
import { useRouter } from "next/navigation";

interface ItemDetailsProps {
  item: IInventoryItem;
}

export default function ItemDetails({ item }: ItemDetailsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const router = useRouter();

  const getStockStatus = () => {
    if (item.currentStock === 0) {
      return { label: "Out of Stock", variant: "destructive" as const, showWarning: true };
    }
    if (item.currentStock <= item.minStockThreshold * 0.25) {
      return { label: "Critical", variant: "destructive" as const, showWarning: true };
    }
    if (item.currentStock <= item.minStockThreshold) {
      return { label: "Low Stock", variant: "secondary" as const, showWarning: true };
    }
    return { label: "In Stock", variant: "default" as const, showWarning: false };
  };

  const stockStatus = getStockStatus();

  return (
    <>
      <div className="space-y-6">
        {/* Item Information Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {stockStatus.showWarning && (
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  )}
                  {item.name}
                </CardTitle>
                <CardDescription>{item.description || "No description provided"}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                <Badge variant={item.isActive ? "default" : "secondary"}>
                  {item.isActive ? "Active" : "Inactive"}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SKU</p>
                  <p className="text-sm font-mono">{item.sku}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p className="text-sm">{item.category?.name || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Ruler className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unit</p>
                  <p className="text-sm capitalize">{item.unit}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Stock</p>
                  <p className="text-2xl font-bold">
                    {item.currentStock} <span className="text-sm font-normal">{item.unit}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Minimum Threshold</p>
                  <p className="text-2xl font-bold">
                    {item.minStockThreshold} <span className="text-sm font-normal">{item.unit}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unit Price</p>
                  <p className="text-2xl font-bold">
                    {item.unitPrice ? (
                      <>
                        <Wallet className="inline h-5 w-5" />
                        {item.unitPrice.toFixed(2)}
                      </>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
              </div>
            </div>

            {item.vendors && item.vendors.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Associated Vendors</p>
                <div className="flex flex-wrap gap-2">
                  {item.vendors.map((vendorItem) => (
                    <Badge key={vendorItem.id} variant="outline">
                      {vendorItem.vendor?.name || "Unknown Vendor"}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Created At</p>
                  <p className="font-medium">
                    {new Date(item.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {new Date(item.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History Card removed */}
      </div>

      {isEditOpen && (
        <EditItem
          item={item}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={() => {
            setIsEditOpen(false);
            router.refresh();
          }}
          categories={item.category ? [item.category] : []}
        />
      )}
    </>
  );
}

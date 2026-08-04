"use client";

import { Badge } from "@/features/core/components/badge";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { IInventoryItem } from "../../types/inventory-types";

interface StockIndicatorProps {
  item: IInventoryItem;
  showIcon?: boolean;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function StockIndicator({
  item,
  showIcon = true,
  showPercentage = false,
  size = "md",
}: StockIndicatorProps) {
  const getStockStatus = () => {
    if (item.currentStock === 0) {
      return {
        label: "Out of Stock",
        variant: "destructive" as const,
        icon: XCircle,
        color: "text-destructive",
        severity: "critical",
      };
    }
    if (item.currentStock <= item.minStockThreshold * 0.25) {
      return {
        label: "Critical",
        variant: "destructive" as const,
        icon: AlertTriangle,
        color: "text-destructive",
        severity: "critical",
      };
    }
    if (item.currentStock <= item.minStockThreshold) {
      return {
        label: "Low Stock",
        variant: "secondary" as const,
        icon: AlertTriangle,
        color: "text-yellow-600",
        severity: "warning",
      };
    }
    return {
      label: "In Stock",
      variant: "default" as const,
      icon: CheckCircle,
      color: "text-green-600",
      severity: "normal",
    };
  };

  const getStockPercentage = () => {
    if (item.minStockThreshold === 0) return 0;
    return (item.currentStock / item.minStockThreshold) * 100;
  };

  const stockStatus = getStockStatus();
  const stockPercentage = getStockPercentage();
  const Icon = stockStatus.icon;

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className="flex items-center gap-2">
      {showIcon && <Icon className={`${iconSizes[size]} ${stockStatus.color}`} />}
      <div className="flex items-center gap-2">
        <span className={size === "sm" ? "text-sm" : ""}>
          {item.currentStock} {item.unit}
        </span>
        <Badge variant={stockStatus.variant} className={size === "sm" ? "text-xs" : ""}>
          {stockStatus.label}
        </Badge>
      </div>
      {showPercentage && (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
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
      )}
    </div>
  );
}

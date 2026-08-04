"use client";

import { useEffect, useState } from "react";
import { getIssuances } from "@/features/admin/inventory/actions/issuance-actions";
import { IStudentIssuance } from "@/features/admin/inventory/types/inventory-types";
import { Badge } from "@/features/core/components/badge";
import { Button } from "@/features/core/components/button";
import { Loader2, Eye, Package } from "lucide-react";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import Link from "next/link";

interface IssuanceHistoryProps {
  studentId: string;
}

// Helper function to get status badge variant
function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ISSUED":
      return "secondary";
    case "PARTIALLY_RETURNED":
      return "outline";
    case "RETURNED":
      return "default";
    default:
      return "secondary";
  }
}

// Helper function to format status text
function formatStatus(status: string): string {
  switch (status) {
    case "ISSUED":
      return "Issued";
    case "PARTIALLY_RETURNED":
      return "Partially Returned";
    case "RETURNED":
      return "Returned";
    default:
      return status;
  }
}

export default function IssuanceHistory({ studentId }: IssuanceHistoryProps) {
  const [issuances, setIssuances] = useState<IStudentIssuance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadIssuances();
  }, [studentId]);

  const loadIssuances = async () => {
    setIsLoading(true);
    try {
      const data = await getIssuances({ studentId });
      setIssuances(data);
    } catch (error) {
      console.error("Error loading issuances:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (issuances.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No items issued to this student yet.</p>
      </div>
    );
  }

  // Separate current and historical issuances
  const currentIssuances = issuances.filter(
    (i) => i.status === "ISSUED" || i.status === "PARTIALLY_RETURNED"
  );
  const historicalIssuances = issuances.filter((i) => i.status === "RETURNED");

  return (
    <div className="space-y-6">
      {/* Current Issuances */}
      {currentIssuances.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Current Issuances</h3>
          <div className="space-y-3">
            {currentIssuances.map((issuance) => {
              const remainingQty = issuance.quantity - issuance.returnedQty;
              return (
                <div
                  key={issuance.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{issuance.item?.name}</h4>
                        <Badge variant={getStatusBadgeVariant(issuance.status)}>
                          {formatStatus(issuance.status)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-4">
                          <span>
                            Issued: {issuance.quantity} {issuance.item?.unit}
                          </span>
                          {issuance.returnedQty > 0 && (
                            <span>
                              Returned: {issuance.returnedQty} {issuance.item?.unit}
                            </span>
                          )}
                          <span className="font-medium text-foreground">
                            Remaining: {remainingQty} {issuance.item?.unit}
                          </span>
                        </div>
                        <div>
                          Issued on: {formatNepaliDateFromDate(new Date(issuance.issuedDate))}
                        </div>
                        {issuance.item?.category && (
                          <div>Category: {issuance.item.category.name}</div>
                        )}
                      </div>
                    </div>
                    <Link href={`/admin/inventory/issuances/${issuance.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical Issuances */}
      {historicalIssuances.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Historical Issuances</h3>
          <div className="space-y-3">
            {historicalIssuances.map((issuance) => (
              <div
                key={issuance.id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors opacity-75"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{issuance.item?.name}</h4>
                      <Badge variant="default">Returned</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        Quantity: {issuance.quantity} {issuance.item?.unit}
                      </div>
                      <div className="flex items-center gap-4">
                        <span>
                          Issued: {formatNepaliDateFromDate(new Date(issuance.issuedDate))}
                        </span>
                        {issuance.returnedDate && (
                          <span>
                            Returned: {formatNepaliDateFromDate(new Date(issuance.returnedDate))}
                          </span>
                        )}
                      </div>
                      {issuance.item?.category && (
                        <div>Category: {issuance.item.category.name}</div>
                      )}
                    </div>
                  </div>
                  <Link href={`/admin/inventory/issuances/${issuance.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

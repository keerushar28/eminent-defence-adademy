"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/features/core/components/card";
import { Badge } from "@/features/core/components/badge";
import { Button } from "@/features/core/components/button";
import { Separator } from "@/features/core/components/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/features/core/components/avatar";
import { IStudentIssuance, IssuanceStatus } from "../types/inventory-types";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import { Package, Calendar, User, FileText, RotateCcw } from "lucide-react";
import { useState } from "react";
import ReturnItem from "./ReturnItem";

interface IssuanceDetailsProps {
  issuance: IStudentIssuance;
  onUpdate?: () => void;
}

// Helper function to get status badge variant
function getStatusBadgeVariant(status: IssuanceStatus): "default" | "secondary" | "destructive" | "outline" {
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
function formatStatus(status: IssuanceStatus): string {
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

export default function IssuanceDetails({ issuance, onUpdate }: IssuanceDetailsProps) {
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  const canReturn = issuance.status === "ISSUED" || issuance.status === "PARTIALLY_RETURNED";
  const remainingQty = issuance.quantity - issuance.returnedQty;

  return (
    <div className="space-y-6">
      {/* Issuance Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Issuance Details</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Issued on {formatNepaliDateFromDate(new Date(issuance.issuedDate))}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(issuance.status)} className="text-sm">
                {formatStatus(issuance.status)}
              </Badge>
              {canReturn && (
                <Button onClick={() => setIsReturnOpen(true)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Return Item
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Information */}
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={issuance.student?.student_image} alt={issuance.student?.fullname} />
                <AvatarFallback>{issuance.student?.fullname?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Student</p>
                <p className="text-sm text-muted-foreground">{issuance.student?.fullname || "N/A"}</p>
                {issuance.student?.email && (
                  <p className="text-xs text-muted-foreground">{issuance.student.email}</p>
                )}
                {issuance.student?.contact_number_student && (
                  <p className="text-xs text-muted-foreground">{issuance.student.contact_number_student}</p>
                )}
              </div>
            </div>

            {/* Item Information */}
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Item</p>
                <p className="text-sm text-muted-foreground">{issuance.item?.name || "N/A"}</p>
                <p className="text-xs text-muted-foreground">
                  {issuance.item?.category?.name} • SKU: {issuance.item?.sku}
                </p>
              </div>
            </div>

            {/* Issued Date */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Issued Date</p>
                <p className="text-sm text-muted-foreground">
                  {formatNepaliDateFromDate(new Date(issuance.issuedDate))}
                </p>
              </div>
            </div>

            {/* Issued By */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Issued By</p>
                <p className="text-sm text-muted-foreground">{issuance.issuedBy}</p>
              </div>
            </div>

            {/* Return Date (if applicable) */}
            {issuance.returnedDate && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Returned Date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatNepaliDateFromDate(new Date(issuance.returnedDate))}
                  </p>
                </div>
              </div>
            )}
          </div>

          {issuance.notes && (
            <>
              <Separator />
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{issuance.notes}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quantity Information */}
      <Card>
        <CardHeader>
          <CardTitle>Quantity Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Issued Quantity</p>
                <p className="text-2xl font-semibold">
                  {issuance.quantity} {issuance.item?.unit}
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Returned Quantity</p>
                <p className="text-2xl font-semibold">
                  {issuance.returnedQty} {issuance.item?.unit}
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Remaining Quantity</p>
                <p className="text-2xl font-semibold">
                  {remainingQty} {issuance.item?.unit}
                </p>
              </div>
            </div>

            {remainingQty > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> {remainingQty} {issuance.item?.unit} still needs to be returned.
                </p>
              </div>
            )}

            {issuance.status === "RETURNED" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>✓ Complete:</strong> All items have been returned.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Return Item Dialog */}
      {canReturn && (
        <ReturnItem
          issuance={issuance}
          isOpen={isReturnOpen}
          onClose={() => setIsReturnOpen(false)}
          onSuccess={() => {
            setIsReturnOpen(false);
            onUpdate?.();
          }}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/features/core/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/features/core/components/dialog";
import { Label } from "@/features/core/components/label";
import { Textarea } from "@/features/core/components/textarea";
import { Badge } from "@/features/core/components/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/features/core/components/alert-dialog";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import { updatePaymentSettlementStatus } from "../actions/settlement-actions";
import type { PaymentWithDetails } from "../types";

interface PaymentSettlementDialogProps {
  payment: PaymentWithDetails;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdated: () => void;
}

export function PaymentSettlementDialog({
  payment,
  isOpen,
  onOpenChange,
  onStatusUpdated,
}: PaymentSettlementDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [showUnsettleConfirm, setShowUnsettleConfirm] = useState(false);
  const [settlementForm, setSettlementForm] = useState({
    paymentMethod: "CASH",
    referenceNumber: "",
    notes: "",
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    const nepaliDate = formatNepaliDateFromDate(new Date(date));
    const englishTime = new Intl.DateTimeFormat("en-NP", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
    
    return `${nepaliDate} ${englishTime}`;
  };

  const getPaymentDetails = () => {
    switch (payment.type) {
      case "CATEGORY":
        return {
          student: payment.studentCategory?.student.fullname || "N/A",
          detail: `${payment.studentCategory?.subCategory.category.name} - ${payment.studentCategory?.subCategory.name}`,
        };
      case "HOSTEL":
        return {
          student: payment.hostelAllocation?.student.fullname || "N/A",
          detail: `Room ${payment.hostelAllocation?.bed.room.roomNumber} - Bed ${payment.hostelAllocation?.bed.bedNumber}`,
        };
      case "ISSUANCE":
        return {
          student: payment.issuance?.student.fullname || "N/A",
          detail: `${payment.issuance?.item.category.name} - ${payment.issuance?.item.name}`,
        };
      default:
        return { student: "N/A", detail: "N/A" };
    }
  };

  const handleMarkAsSettled = () => {
    startTransition(async () => {
      try {
        const result = await updatePaymentSettlementStatus(
          payment.id,
          payment.type,
          true,
          {
            notes: settlementForm.notes || undefined,
          }
        );

        if (result.success) {
          toast.success("Payment approved and settled successfully");
          onStatusUpdated();
          onOpenChange(false);
          setSettlementForm({
            paymentMethod: "CASH",
            referenceNumber: "",
            notes: "",
          });
        } else {
          toast.error(result.error || "Failed to approve payment");
        }
      } catch (error) {
        toast.error("An error occurred while approving payment");
      }
    });
  };

  const handleMarkAsUnsettled = () => {
    startTransition(async () => {
      try {
        const result = await updatePaymentSettlementStatus(
          payment.id,
          payment.type,
          false
        );

        if (result.success) {
          toast.success("Payment approval revoked successfully");
          onStatusUpdated();
          onOpenChange(false);
          setShowUnsettleConfirm(false);
        } else {
          toast.error(result.error || "Failed to revoke payment approval");
        }
      } catch (error) {
        toast.error("An error occurred while revoking approval");
      }
    });
  };

  const details = getPaymentDetails();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {payment.isSettled ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-orange-600" />
              )}
              Payment Approval Status
            </DialogTitle>
            <DialogDescription>
              Approve or manage the approval status for this payment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Payment Details */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Student:</span>
                <span className="text-sm">{details.student}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Type:</span>
                <Badge className={
                  payment.type === "CATEGORY" ? "bg-blue-100 text-blue-800" :
                  payment.type === "HOSTEL" ? "bg-green-100 text-green-800" :
                  "bg-purple-100 text-purple-800"
                }>
                  {payment.type}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Details:</span>
                <span className="text-sm text-right max-w-48 truncate" title={details.detail}>
                  {details.detail}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Amount:</span>
                <span className="text-sm font-semibold">{formatCurrency(payment.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Date:</span>
                <span className="text-sm">{formatDate(payment.paymentDate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Recorded By:</span>
                <div className="text-sm text-right">
                  <div className="font-medium">
                    {payment.createdByUser?.username || 'Unknown User'}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {payment.createdByUser?.email || 'No email'}
                  </div>
                </div>
              </div>
              {payment.isSettled && payment.approvedBy && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Approved By:</span>
                  <div className="text-sm text-right">
                    <div className="font-medium text-green-700">
                      {payment.approvedBy.username}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {payment.approvedBy.email}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                {payment.isSettled ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Approved
                  </Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-800">
                    <Clock className="mr-1 h-3 w-3" />
                    Pending Approval
                  </Badge>
                )}
              </div>
            </div>

            {/* Approval Notes (only show if not settled) */}
            {!payment.isSettled && (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="notes">Approval Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={settlementForm.notes}
                    onChange={(e) => 
                      setSettlementForm(prev => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Enter any notes about this approval/settlement"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            {payment.isSettled ? (
              <Button
                variant="destructive"
                onClick={() => setShowUnsettleConfirm(true)}
                disabled={isPending}
              >
                Revoke Approval
              </Button>
            ) : (
              <Button
                onClick={handleMarkAsSettled}
                disabled={isPending}
              >
                {isPending ? "Processing..." : "Approve Payment"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsettle Confirmation Dialog */}
      <AlertDialog open={showUnsettleConfirm} onOpenChange={setShowUnsettleConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Revoke Payment Approval
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the approval for this payment? This will mark it as pending approval again.
              If this is the only payment in the settlement record, the entire settlement record will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkAsUnsettled}
              disabled={isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isPending ? "Processing..." : "Revoke Approval"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
"use client";

import { IStudentIssuance, IIssuancePayment } from "../types/inventory-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/features/core/components/dialog";
import { Badge } from "@/features/core/components/badge";
import { Button } from "@/features/core/components/button";
import { Separator } from "@/features/core/components/separator";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import { useState, useEffect } from "react";
import { getIssuancePayments } from "@/features/admin/inventory/actions/issuance-payment-actions";
import IssuancePaymentForm from "./IssuancePaymentForm";
import IssuancePaymentHistory from "./IssuancePaymentHistory";
import { useSession } from "next-auth/react";
import { Package, Calendar, FileText, CreditCard, CheckCircle2, RotateCcw } from "lucide-react";
import ReturnItem from "./ReturnItem";

interface IssuanceDetailsDialogProps {
  issuance: IStudentIssuance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess?: () => void;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  ISSUED: { label: "Issued", variant: "default" },
  PARTIALLY_RETURNED: { label: "Partially Returned", variant: "secondary" },
  RETURNED: { label: "Returned", variant: "outline" },
};

function DataField({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${valueClass ?? ""}`}>{value}</span>
    </div>
  );
}

export default function IssuanceDetailsDialog({
  issuance,
  open,
  onOpenChange,
  onPaymentSuccess,
}: IssuanceDetailsDialogProps) {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<IIssuancePayment[]>([]);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  useEffect(() => {
    if (open && issuance) loadPayments();
  }, [open, issuance]);

  const loadPayments = async () => {
    if (!issuance) return;
    setIsLoadingPayments(true);
    try {
      const data = await getIssuancePayments(issuance.id);
      setPayments(data);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaymentFormOpen(false);
    loadPayments();
    onPaymentSuccess?.();
  };

  if (!issuance) return null;

  const totalAmount = issuance.quantity * (issuance.unitPrice || 0);
  const totalPaid = issuance.totalPaid || 0;
  const remainingAmount = Math.max(0, totalAmount - totalPaid);
  const paymentPercentage = totalAmount > 0 ? Math.min(100, (totalPaid / totalAmount) * 100) : 0;
  const isFullyPaid = remainingAmount === 0;
  const status = STATUS_MAP[issuance.status] ?? { label: issuance.status, variant: "secondary" };
  const canReturn = issuance.status === "ISSUED" || issuance.status === "PARTIALLY_RETURNED";
  const remainingQty = issuance.quantity - issuance.returnedQty;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-lg font-semibold leading-snug">
                Issuance Details
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {issuance.student?.fullname}
              </p>
            </div>
            <Badge variant={status.variant} className="mt-0.5 shrink-0">
              {status.label}
            </Badge>
          </div>
        </DialogHeader>

        <Separator />

        <div className="px-6 py-5 space-y-6">
          {/* Item Information */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Package className="h-3.5 w-3.5" />
              Item Information
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <DataField
                label="Item Name"
                value={issuance.item?.name}
                sub={issuance.item?.category?.name}
              />
              <DataField
                label="Quantity"
                value={`${issuance.quantity} ${issuance.item?.unit ?? ""}`}
              />
              <DataField
                label="Unit Price"
                value={`NPR ${(issuance.unitPrice || 0).toFixed(2)}`}
              />
              <DataField
                label="Total Amount"
                value={`NPR ${totalAmount.toFixed(2)}`}
              />
            </div>
          </section>

          {/* Quantity & Return Section */}
          {canReturn && (
            <>
              <Separator />
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Quantity Details
                  </div>
                  <Button size="sm" onClick={() => setIsReturnOpen(true)}>
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    Return Item
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Issued</p>
                    <p className="text-lg font-semibold">{issuance.quantity}</p>
                    <p className="text-xs text-muted-foreground">{issuance.item?.unit}</p>
                  </div>
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Returned</p>
                    <p className="text-lg font-semibold">{issuance.returnedQty}</p>
                    <p className="text-xs text-muted-foreground">{issuance.item?.unit}</p>
                  </div>
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="text-lg font-semibold">{remainingQty}</p>
                    <p className="text-xs text-muted-foreground">{issuance.item?.unit}</p>
                  </div>
                </div>
              </section>
            </>
          )}

          <Separator />
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Calendar className="h-3.5 w-3.5" />
              Issued Date
            </div>
            <p className="text-sm font-medium">
              {formatNepaliDateFromDate(new Date(issuance.issuedDate))}
            </p>
          </section>

          {/* Notes */}
          {issuance.notes && (
            <>
              <Separator />
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <FileText className="h-3.5 w-3.5" />
                  Notes
                </div>
                <p className="text-sm text-foreground leading-relaxed">{issuance.notes}</p>
              </section>
            </>
          )}

          <Separator />

          {/* Payment Summary */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <CreditCard className="h-3.5 w-3.5" />
              Payment Summary
            </div>

            <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-0.5">
              <SummaryRow label="Total Amount" value={`NPR ${totalAmount.toFixed(2)}`} />
              <SummaryRow
                label="Amount Paid"
                value={`NPR ${totalPaid.toFixed(2)}`}
                valueClass="text-green-700 dark:text-green-500"
              />
              <Separator className="my-2" />
              <SummaryRow
                label="Remaining"
                value={`NPR ${remainingAmount.toFixed(2)}`}
                valueClass={remainingAmount > 0 ? "text-destructive" : "text-green-700 dark:text-green-500"}
              />
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Payment progress</span>
                <span className="tabular-nums font-medium">{paymentPercentage.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-foreground transition-all duration-500"
                  style={{ width: `${paymentPercentage}%` }}
                />
              </div>
            </div>

            {isFullyPaid ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-500">
                  Fully Paid
                </span>
              </div>
            ) : (
              <Button
                onClick={() => setIsPaymentFormOpen(true)}
                className="w-full"
                size="sm"
              >
                Record Payment
              </Button>
            )}
          </section>

          {/* Payment History */}
          {!isLoadingPayments && payments.length > 0 && (
            <>
              <Separator />
              <section className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Payment History
                </p>
                <IssuancePaymentHistory
                  payments={payments}
                  onPaymentDeleted={loadPayments}
                />
              </section>
            </>
          )}
        </div>
      </DialogContent>

      <IssuancePaymentForm
        isOpen={isPaymentFormOpen}
        onClose={() => setIsPaymentFormOpen(false)}
        onSuccess={handlePaymentSuccess}
        issuance={issuance}
        currentUserId={session?.user?.id || ""}
      />

      {canReturn && (
        <ReturnItem
          issuance={issuance}
          isOpen={isReturnOpen}
          onClose={() => setIsReturnOpen(false)}
          onSuccess={() => {
            setIsReturnOpen(false);
            loadPayments();
            onPaymentSuccess?.();
          }}
        />
      )}
    </Dialog>
  );
}
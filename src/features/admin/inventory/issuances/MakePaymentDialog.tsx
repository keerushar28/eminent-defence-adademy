"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/features/core/components/sheet";
import { Button } from "@/features/core/components/button";
import { Input } from "@/features/core/components/input";
import { Textarea } from "@/features/core/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/core/components/select";
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker";
import { createIssuancePayment } from "../actions/issuance-payment-actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { IStudentIssuance } from "../types/inventory-types";

// Convert Date to YYYY-MM-DD format to avoid timezone issues
const convertDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface MakePaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  issuance: IStudentIssuance;
}

export function MakePaymentDialog({
  isOpen,
  onClose,
  onSuccess,
  issuance,
}: MakePaymentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());

  const totalAmount = issuance.quantity * (issuance.unitPrice || 0);
  const paidAmount = issuance.totalPaid || 0;
  const balanceDue = totalAmount - paidAmount;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const issuanceId = formData.get("issuanceId") as string;
      
      // Convert Nepali date to English format (YYYY-MM-DD) and then to ISO datetime
      const englishDateString = convertDateToYYYYMMDD(paymentDate);
      const dateObj = new Date(englishDateString + "T00:00:00Z");
      formData.set("paymentDate", dateObj.toISOString());
      
      const result = await createIssuancePayment(issuanceId, formData);

      if (result.success) {
        toast.success("Payment recorded successfully! 🎉", {
          description: `Payment of NPR ${(formData.get("amount") as string)} has been recorded.`,
        });
        onSuccess();
      } else {
        toast.error(result.error || "Failed to create payment", {
          description: "Could not record the payment. Please try again.",
        });
      }
    } catch (error) {
      toast.error("Failed to create payment", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl gap-0 pb-2 p-6 h-full font-medium overflow-y-auto">
        <SheetHeader className="mb-6 p-0 border-b pb-4 gap-0.5">
          <SheetTitle className="text-2xl">Record Payment</SheetTitle>
          <SheetDescription className="text-sm font-normal">
            Record a payment for {issuance.item?.name}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <input type="hidden" name="issuanceId" value={issuance.id} />

          {/* Item Summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Item Details
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border bg-card">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Item Name</p>
                <p className="font-medium text-sm">{issuance.item?.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                <p className="font-medium text-sm">
                  {issuance.quantity} {issuance.item?.unit}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Unit Price</p>
                <p className="font-medium text-sm">
                  NPR {(Number(issuance.unitPrice) || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                <p className="font-semibold text-sm">NPR {totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Payment Summary
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border bg-card">
                <p className="text-xs text-muted-foreground mb-1">Already Paid</p>
                <p className="text-lg font-semibold text-green-600">
                  NPR {paidAmount.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <p className="text-xs text-muted-foreground mb-1">Balance Due</p>
                <p className="text-lg font-semibold text-red-600">
                  NPR {balanceDue.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <p className="text-xs text-muted-foreground mb-1">Payment %</p>
                <p className="text-lg font-semibold text-blue-600">
                  {totalAmount > 0
                    ? ((paidAmount / totalAmount) * 100).toFixed(0)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Payment Details
            </h3>

            <div>
              <label className="text-sm font-medium block mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  NPR 
                </span>
                <Input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={balanceDue}
                  placeholder="0.00"
                  className="pl-7"
                  required
                  disabled={isSubmitting || balanceDue === 0}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum: NPR {balanceDue.toFixed(2)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <NepaliDatePicker
                  value={paymentDate}
                  onChange={(date) => {
                    if (date instanceof Date) {
                      setPaymentDate(date);
                    }
                  }}
                  placeholder="Select date"
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <Select name="paymentMethod" defaultValue="CASH" required>
                  <SelectTrigger disabled={isSubmitting}>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Reference Number
              </label>
              <Input
                name="referenceNumber"
                placeholder="Transaction/Cheque number (optional)"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Notes</label>
              <Textarea
                name="notes"
                placeholder="Additional notes (optional)"
                className="resize-none text-sm min-h-20"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || balanceDue === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  Record Payment
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

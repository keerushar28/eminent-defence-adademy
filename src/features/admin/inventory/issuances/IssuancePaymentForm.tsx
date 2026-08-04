'use client'

import { Button } from "@/features/core/components/button"
import { Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/features/core/components/sheet"
import { Input } from "@/features/core/components/input"
import { Textarea } from "@/features/core/components/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/core/components/select"
import { DatePicker } from "@/features/core/components/date-picker"
import { toast } from "sonner"
import { useState } from "react"
import { z } from "zod"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { IStudentIssuance } from "../types/inventory-types"
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date"
import { createIssuancePayment } from "../actions/issuance-payment-actions"

const paymentFormSchema = z.object({
  amount: z.number()
    .positive("Amount must be greater than zero")
    .min(0.01, "Amount must be at least 0.01"),

  paymentDate: z.date("Payment date is required"),

  paymentMethod: z.string()
    .min(1, "Payment method is required"),

  referenceNumber: z.string()
    .max(100, "Reference number must not exceed 100 characters")
    .optional(),

  notes: z.string()
    .max(500, "Notes must not exceed 500 characters")
    .optional(),
})

type PaymentFormData = z.infer<typeof paymentFormSchema>

interface IssuancePaymentFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  issuance: IStudentIssuance | null
  currentUserId: string
}

export default function IssuancePaymentForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  issuance, 
  currentUserId 
}: IssuancePaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      paymentDate: new Date(),
      paymentMethod: "CASH",
      referenceNumber: "",
      notes: "",
    },
  })

  const handleSubmit = async (values: PaymentFormData) => {
    if (isSubmitting || !issuance) return

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("amount", values.amount.toString())
      formData.append("paymentDate", values.paymentDate.toISOString())
      formData.append("paymentMethod", values.paymentMethod)
      formData.append("referenceNumber", values.referenceNumber || "")
      formData.append("notes", values.notes || "")

      const result = await createIssuancePayment(issuance.id, formData, currentUserId)

      if (result.success) {
        toast.success("Payment Recorded Successfully! 🎉", {
          description: `Payment of NPR ${values.amount.toFixed(2)} has been recorded for ${issuance.student?.fullname}.`,
          duration: 5000,
        })

        form.reset()
        onSuccess()
      } else {
        toast.error("Failed to Record Payment ❌", {
          description: result.error || "Something went wrong. Please try again.",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("Submission error:", error)
      toast.error("Submission Error ❌", {
        description: "An unexpected error occurred. Please try again.",
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    form.reset()
    onClose()
  }

  if (!issuance) {
    return null
  }

  const totalAmount = issuance.quantity * (issuance.unitPrice || 0)
  const remainingAmount = Math.max(0, totalAmount - (issuance.totalPaid || 0))

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl gap-0 pb-2 p-6 h-full font-medium overflow-y-auto">
        <SheetHeader className="mb-2 p-0 border-b pb-4 gap-0.5">
          <SheetTitle className="text-xl">
            Record Payment for Issuance
          </SheetTitle>
          <SheetDescription className="text-sm font-normal">
            Record a payment for the inventory issuance
          </SheetDescription>
        </SheetHeader>

        {/* Issuance Info */}
        <div className="p-4 border rounded-md bg-muted/30 mb-6 mt-4">
          <h4 className="font-medium mb-3">Issuance Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student:</span>
              <span className="font-medium">{issuance.student?.fullname}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Item:</span>
              <span className="font-medium">{issuance.item?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity:</span>
              <span className="font-medium">{issuance.quantity} {issuance.item?.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit Price:</span>
              <span className="font-medium">NPR {(issuance.unitPrice || 0).toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
              <span>Total Amount:</span>
              <span>NPR {totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Already Paid:</span>
              <span className="font-medium">NPR {(issuance.totalPaid || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-primary">
              <span className="font-medium">Remaining:</span>
              <span className="font-semibold">NPR {remainingAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Issued Date:</span>
              <span className="font-medium">{formatNepaliDateFromDate(new Date(issuance.issuedDate), "MMM dd, yyyy")}</span>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">
              Amount (NPR ) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={remainingAmount}
              placeholder="Enter payment amount"
              {...form.register("amount", { valueAsNumber: true })}
              disabled={isSubmitting || remainingAmount === 0}
            />
            {form.formState.errors.amount && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.amount.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Maximum amount: NPR {remainingAmount.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <Controller
              name="paymentDate"
              control={form.control}
              render={({ field }) => (
                <DatePicker
                  date={field.value}
                  onDateChange={field.onChange}
                  placeholder="Select payment date"
                  disabled={isSubmitting}
                />
              )}
            />
            {form.formState.errors.paymentDate && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.paymentDate.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <Controller
              name="paymentMethod"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select payment method..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.paymentMethod && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.paymentMethod.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Reference Number <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <Input
              placeholder="Enter transaction reference number"
              {...form.register("referenceNumber")}
              disabled={isSubmitting}
            />
            {form.formState.errors.referenceNumber && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.referenceNumber.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Notes <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <Textarea
              placeholder="Enter any additional notes..."
              {...form.register("notes")}
              className="resize-none text-sm min-h-20"
              disabled={isSubmitting}
            />
            {form.formState.errors.notes && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.notes.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || remainingAmount === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
  )
}

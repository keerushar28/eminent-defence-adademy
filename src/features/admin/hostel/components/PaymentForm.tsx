'use client'

import { Button } from "@/features/core/components/button"
import { Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/features/core/components/sheet"
import { Input } from "@/features/core/components/input"
import { Textarea } from "@/features/core/components/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/core/components/select"
import { DatePicker } from "@/features/core/components/date-picker"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Allocation } from "../types/hostel.types"
import { calculateDaysPurchased, calculateNewPaidUntil } from "../lib/calculations"
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date"

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

interface PaymentFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  allocation: Allocation | null
  currentUserId: string
}

export default function PaymentForm({ isOpen, onClose, onSuccess, allocation, currentUserId }: PaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [calculatedDays, setCalculatedDays] = useState<number>(0)
  const [newPaidUntil, setNewPaidUntil] = useState<Date | null>(null)

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

  const watchAmount = form.watch("amount")

  // Calculate days purchased when amount changes
  useEffect(() => {
    if (!allocation || !watchAmount || watchAmount <= 0) {
      setCalculatedDays(0)
      setNewPaidUntil(null)
      return
    }

    // Get effective price
    const effectivePrice = allocation.bed?.pricePerDay || 0

    if (effectivePrice <= 0) {
      setCalculatedDays(0)
      setNewPaidUntil(null)
      return
    }

    // Calculate days purchased
    const days = calculateDaysPurchased(watchAmount, effectivePrice)
    setCalculatedDays(days)

    // Calculate new paid until date
    const newDate = calculateNewPaidUntil(new Date(allocation.paidUntil), days)
    setNewPaidUntil(newDate)
  }, [watchAmount, allocation])

  const handleSubmit = async (values: PaymentFormData) => {
    if (isSubmitting || !allocation) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/hostel/allocations/${allocation.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: values.amount,
          paymentDate: values.paymentDate.toISOString(),
          paymentMethod: values.paymentMethod,
          referenceNumber: values.referenceNumber || undefined,
          notes: values.notes || undefined,
          createdBy: currentUserId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create payment')
      }


      toast.success("Payment Recorded Successfully! 🎉", {
        description: `Payment of NPR ${values.amount.toFixed(2)} has been recorded. ${calculatedDays} day(s) added.`,
        duration: 5000,
      })

      form.reset()
      onSuccess()
    } catch (error) {
      console.error("Submission error:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"

      toast.error("Failed to Record Payment ❌", {
        description: errorMessage,
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

  if (!allocation) {
    return null
  }

  const effectivePrice = allocation.bed?.pricePerDay || 0
  const studentName = ((allocation.student as unknown as Record<string, unknown>)?.fullname as string) || ((allocation.student as unknown as Record<string, unknown>)?.name as string) || "Unknown Student"
  const roomNumber = ((allocation.bed as unknown as Record<string, unknown>)?.room as Record<string, unknown>)?.roomNumber as string || "N/A"
  const bedNumber = (allocation.bed as unknown as Record<string, unknown>)?.bedNumber as string || "N/A"

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl gap-0 pb-2 p-6 h-full font-medium overflow-y-auto">
        <SheetHeader className="mb-2 p-0 border-b pb-4 gap-0.5">
          <SheetTitle className="text-xl">
            Record Payment
          </SheetTitle>
          <SheetDescription className="text-sm font-normal">
            Record a payment for the student&apos;s hostel allocation
          </SheetDescription>
        </SheetHeader>

        {/* Allocation Info */}
        <div className="p-4 border rounded-md bg-muted/30 mb-6 mt-4">
          <h4 className="font-medium mb-3">Allocation Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student:</span>
              <span className="font-medium">{studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Room / Bed:</span>
              <span className="font-medium">Room {roomNumber} / Bed {bedNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price per day:</span>
              <span className="font-medium">NPR {effectivePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Paid Until:</span>
              <span className="font-medium">{formatNepaliDateFromDate(new Date(allocation.paidUntil))}</span>
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
              placeholder="Enter payment amount"
              {...form.register("amount", { valueAsNumber: true })}
              disabled={isSubmitting}
            />
            {form.formState.errors.amount && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.amount.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Enter the amount received from the student
            </p>
          </div>

          {/* Calculated Days Display */}
          {calculatedDays > 0 && newPaidUntil && (
            <div className="p-4 border rounded-md bg-primary/5 border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-primary">Payment Calculation</h4>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days Purchased:</span>
                  <span className="font-medium">{calculatedDays} day(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Paid Until:</span>
                  <span className="font-medium">{formatNepaliDateFromDate(newPaidUntil)}</span>
                </div>
              </div>
            </div>
          )}

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
            <p className="text-xs text-muted-foreground mt-1">
              The date when the payment was received
            </p>
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
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
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
            <p className="text-xs text-muted-foreground mt-1">
              Transaction ID, receipt number, or other reference
            </p>
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
              disabled={isSubmitting || calculatedDays === 0}
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

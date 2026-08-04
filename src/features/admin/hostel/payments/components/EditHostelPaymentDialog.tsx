'use client'

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/features/core/components/button"
import { Input } from "@/features/core/components/input"
import { Label } from "@/features/core/components/label"
import { Textarea } from "@/features/core/components/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/core/components/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/features/core/components/sheet"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { updateHostelPayment } from "../actions/hostel-payment-actions"
import { Alert, AlertDescription } from "@/features/core/components/alert"
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date"

interface HostelPayment {
  id: string
  amount: number
  paymentDate: Date
  daysPurchased: number
  updatedPaidUntil: Date
  paymentMethod: string
  referenceNumber: string | null
  notes: string | null
  createdBy: string
  allocation: {
    id: string
    student: {
      id: string
      fullname: string
      email: string
      contact_number_student: string
    }
    bed: {
      id: string
      bedNumber: string
      pricePerDay: number
      room: {
        id: string
        roomNumber: string
      }
    }
  }
}

interface EditHostelPaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedPayment: HostelPayment) => void
  payment: HostelPayment | null
}

export default function EditHostelPaymentDialog({
  isOpen,
  onClose,
  onSuccess,
  payment,
}: EditHostelPaymentDialogProps) {
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form when payment changes
  useEffect(() => {
    if (payment && isOpen) {
      setPaymentAmount(payment.amount.toString())
      setPaymentMethod(payment.paymentMethod)
      setReferenceNumber(payment.referenceNumber || "")
      setNotes(payment.notes || "")
    }
  }, [payment, isOpen])

  // Calculate days and paid until changes
  const calculations = useMemo(() => {
    if (!payment) return null

    const pricePerDay = payment.allocation.bed.pricePerDay
    const newAmount = parseFloat(paymentAmount) || 0
    const oldAmount = payment.amount
    const oldDaysPurchased = payment.daysPurchased
    const oldPaidUntil = new Date(payment.updatedPaidUntil)

    // Calculate new days purchased
    const newDaysPurchased = Math.floor(newAmount / pricePerDay)

    // Calculate the difference in days
    const daysDifference = newDaysPurchased - oldDaysPurchased

    // Calculate new paid until date
    const newPaidUntil = new Date(oldPaidUntil)
    newPaidUntil.setDate(newPaidUntil.getDate() + daysDifference)

    return {
      oldAmount,
      newAmount,
      oldDaysPurchased,
      newDaysPurchased,
      daysDifference,
      oldPaidUntil,
      newPaidUntil,
      pricePerDay,
    }
  }, [payment, paymentAmount])

  const handleSubmit = async () => {
    if (!payment) {
      toast.error("Payment not found")
      return
    }

    const amount = parseFloat(paymentAmount)

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid payment amount")
      return
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await updateHostelPayment(
        payment.id,
        amount,
        paymentMethod,
        referenceNumber || null,
        notes || null
      )

      if (result.success) {
        toast.success("Payment updated successfully!")
        const updatedPayment: HostelPayment = {
          ...payment,
          amount,
          paymentMethod,
          referenceNumber: referenceNumber || null,
          notes: notes || null,
          daysPurchased: calculations?.newDaysPurchased || 0,
          updatedPaidUntil: calculations?.newPaidUntil || payment.updatedPaidUntil,
        }
        onSuccess(updatedPayment)
        handleClose()
      } else {
        toast.error(result.error || "Failed to update payment")
      }
    } catch (error) {
      console.error("Error updating payment:", error)
      toast.error("An error occurred while updating payment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setPaymentAmount("")
    setPaymentMethod("")
    setReferenceNumber("")
    setNotes("")
    onClose()
  }

  if (!payment || !calculations) return null

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl h-full overflow-y-auto p-4">
        <SheetHeader className="mb-6 p-0">
          <SheetTitle>Edit Hostel Payment</SheetTitle>
          <SheetDescription>
            Update payment details for {payment.allocation.student.fullname}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Student and Room Info */}
          <div className="p-3 bg-muted/40 rounded border border-border/50 space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Student</p>
              <p className="font-semibold text-sm">{payment.allocation.student.fullname}</p>
              <p className="text-xs text-muted-foreground">{payment.allocation.student.email}</p>
            </div>
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground">Room & Bed</p>
              <p className="font-semibold text-sm">
                Room {payment.allocation.bed.room.roomNumber} - Bed {payment.allocation.bed.bedNumber}
              </p>
              <p className="text-xs text-muted-foreground">
                Rs {payment.allocation.bed.pricePerDay.toLocaleString()} per day
              </p>
            </div>
          </div>

          {/* Current Payment Info */}
          <div className="p-3 bg-muted/40 rounded border border-border/50 space-y-2">
            <h4 className="font-semibold text-sm">Current Payment</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="space-y-0.5">
                <p className="text-muted-foreground">Amount</p>
                <p className="font-semibold">Rs {calculations.oldAmount.toLocaleString()}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-muted-foreground">Days</p>
                <p className="font-semibold">{calculations.oldDaysPurchased}d</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-muted-foreground">Paid Until</p>
                <p className="font-semibold">{formatNepaliDateFromDate(calculations.oldPaidUntil)}</p>
              </div>
            </div>
          </div>

          {/* Payment Details Form */}
          <div className="space-y-3 p-3 bg-background border rounded">
            <div className="space-y-3">
              <div>
                <Label className="text-sm">
                  Payment Amount (Rs) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Enter amount"
                  value={paymentAmount}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setPaymentAmount(value)
                    }
                  }}
                  disabled={isSubmitting}
                  className="mt-1 h-9 bg-white text-sm"
                />
              </div>

              <div>
                <Label className="text-sm">
                  Payment Method <span className="text-red-500">*</span>
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={isSubmitting}>
                  <SelectTrigger className="mt-1 h-9 bg-white text-sm">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Reference Number</Label>
                <Input
                  type="text"
                  placeholder="Transaction/Receipt number"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  disabled={isSubmitting}
                  className="mt-1 h-9 bg-white text-sm"
                />
              </div>

              <div>
                <Label className="text-sm">Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                  className="resize-none mt-1 bg-white text-sm"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* New Payment Preview */}
          {paymentAmount && parseFloat(paymentAmount) > 0 && (
            <div className={`p-3 rounded border space-y-2 ${
              calculations.daysDifference > 0
                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                : calculations.daysDifference < 0
                ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900'
                : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
            }`}>
              <h4 className="font-semibold text-sm">After Update</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">New Amount</p>
                  <p className="font-semibold">Rs {calculations.newAmount.toLocaleString()}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">New Days</p>
                  <p className={`font-semibold ${
                    calculations.daysDifference > 0 ? 'text-green-600' :
                    calculations.daysDifference < 0 ? 'text-orange-600' :
                    'text-blue-600'
                  }`}>
                    {calculations.newDaysPurchased}d
                    {calculations.daysDifference > 0 && ` (+${calculations.daysDifference}d)`}
                    {calculations.daysDifference < 0 && ` (${calculations.daysDifference}d)`}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">New Paid Until</p>
                  <p className="font-semibold">{formatNepaliDateFromDate(calculations.newPaidUntil)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Warning if amount is zero */}
          {paymentAmount && parseFloat(paymentAmount) === 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-700">
                Payment amount cannot be zero
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !paymentAmount || parseFloat(paymentAmount) <= 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Updating Payment...
              </>
            ) : (
              <>
                Update Payment
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

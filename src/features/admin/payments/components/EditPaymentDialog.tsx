'use client'

import { useState, useEffect } from "react"
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
import { updatePayment } from "../actions/payment-actions"
import { Alert, AlertDescription } from "@/features/core/components/alert"
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker"

interface Payment {
  id: string
  amount: number
  paymentDate: Date
  paymentMethod: string
  referenceNumber: string | null
  notes: string | null
  createdBy: string
  studentCategory: {
    id: string
    discountAmount: number
    finalFee: number
    totalPaid: number
    student: {
      id: string
      fullname: string
      email: string
      contact_number_student: string
    }
    subCategory: {
      id: string
      name: string
      fee: number
      category: {
        id: string
        name: string
      }
    }
  }
}

interface EditPaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedPayment: Payment) => void
  payment: Payment | null
}

export default function EditPaymentDialog({
  isOpen,
  onClose,
  onSuccess,
  payment,
}: EditPaymentDialogProps) {
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState<Date>(new Date())
  const [paymentMethod, setPaymentMethod] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const convertDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Initialize form when payment changes
  useEffect(() => {
    if (payment && isOpen) {
      setPaymentAmount(payment.amount.toString())
      setPaymentDate(new Date(payment.paymentDate))
      setPaymentMethod(payment.paymentMethod)
      setReferenceNumber(payment.referenceNumber || "")
      setNotes(payment.notes || "")
    }
  }, [payment, isOpen])

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

    // Calculate remaining balance with old amount
    const finalFee = payment.studentCategory.finalFee
    const totalPaid = payment.studentCategory.totalPaid
    const oldAmount = payment.amount
    const currentRemaining = finalFee - totalPaid
    const newRemaining = currentRemaining + oldAmount - amount

    if (newRemaining < 0) {
      toast.error(`New payment amount would exceed remaining balance (NPR ${currentRemaining.toLocaleString()})`)
      return
    }

    setIsSubmitting(true)

    try {
      const result = await updatePayment(
        payment.id,
        amount,
        convertDateToYYYYMMDD(paymentDate),
        paymentMethod,
        referenceNumber || null,
        notes || null
      )

      if (result.success) {
        toast.success("Payment updated successfully!")
        // Update the payment object with new values
        const updatedPayment: Payment = {
          ...payment,
          amount,
          paymentDate,
          paymentMethod,
          referenceNumber: referenceNumber || null,
          notes: notes || null,
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
    setPaymentDate(new Date())
    setPaymentMethod("")
    setReferenceNumber("")
    setNotes("")
    onClose()
  }

  if (!payment) return null

  const finalFee = payment.studentCategory.finalFee
  const totalPaid = payment.studentCategory.totalPaid
  const oldAmount = payment.amount
  const currentRemaining = finalFee - totalPaid
  const newAmount = parseFloat(paymentAmount) || 0
  const newRemaining = currentRemaining + oldAmount - newAmount

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl h-full overflow-y-auto p-4">
        <SheetHeader className="mb-6 p-0">
          <SheetTitle>Edit Payment</SheetTitle>
          <SheetDescription>
            Update payment details for {payment.studentCategory.student.fullname}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Student and Category Info */}
          <div className="p-3 bg-muted/40 rounded border border-border/50 space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Student</p>
              <p className="font-semibold text-sm">{payment.studentCategory.student.fullname}</p>
              <p className="text-xs text-muted-foreground">{payment.studentCategory.student.email}</p>
            </div>
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="font-semibold text-sm">
                {payment.studentCategory.subCategory.category.name} - {payment.studentCategory.subCategory.name}
              </p>
            </div>
          </div>

          {/* Fee Summary */}
          <div className="p-3 bg-muted/40 rounded border border-border/50 space-y-2">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="space-y-0.5">
                <p className="text-muted-foreground">Final Fee</p>
                <p className="font-semibold text-sm">NPR {finalFee.toLocaleString()}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-muted-foreground">Total Paid</p>
                <p className="font-semibold text-sm text-green-600">NPR {totalPaid.toLocaleString()}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-muted-foreground">Current Remaining</p>
                <p className="font-bold text-sm text-red-600">NPR {currentRemaining.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-3 p-3 bg-background border rounded">
            <div className="space-y-3">
              <div>
                <Label className="text-sm">
                  Payment Date <span className="text-red-500">*</span>
                </Label>
                <div className="mt-1">
                  <NepaliDatePicker
                    value={paymentDate}
                    onChange={(value) => {
                      if (value instanceof Date) setPaymentDate(value)
                    }}
                    placeholder="Select payment date"
                    mode="single"
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">
                  Payment Amount (NPR) <span className="text-red-500">*</span>
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
                {paymentAmount && (
                  <div className="text-xs text-muted-foreground mt-1 space-y-1">
                    <p>Old amount: NPR {oldAmount.toLocaleString()}</p>
                    <p>New remaining: NPR {Math.max(0, newRemaining).toLocaleString()}</p>
                  </div>
                )}
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

          {/* Warning if amount exceeds remaining */}
          {newRemaining < 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                Payment amount exceeds remaining balance. Maximum allowed: NPR {currentRemaining.toLocaleString()}
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
            disabled={isSubmitting || newRemaining < 0}
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

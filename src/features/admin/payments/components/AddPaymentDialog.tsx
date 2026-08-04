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
import StudentSelectorOptimized from "@/features/admin/components/StudentSelectorOptimized"
import CategorySelectorOptimized from "@/features/admin/components/CategorySelectorOptimized"
import { getStudentPendingFees, addPayment } from "../actions/payment-actions"
import { Alert, AlertDescription } from "@/features/core/components/alert"
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker"

interface AddPaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialStudentId?: string
  initialCategoryId?: string
}

interface PendingFee {
  id: string
  remaining: number
  finalFee: number
  totalPaid: number
  discountAmount: number
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

export default function AddPaymentDialog({
  isOpen,
  onClose,
  onSuccess,
  initialStudentId,
  initialCategoryId,
}: AddPaymentDialogProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || "")
  const [pendingFees, setPendingFees] = useState<PendingFee[]>([])
  const [loadingFees, setLoadingFees] = useState(false)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(initialCategoryId || "")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState<Date>(new Date())
  const [paymentMethod, setPaymentMethod] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Convert Date to YYYY-MM-DD format to avoid timezone issues
  const convertDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Auto-load pending fees when dialog opens with initialStudentId
  useEffect(() => {
    if (isOpen && initialStudentId) {
      handleStudentChange(initialStudentId, true)
    }
  }, [isOpen, initialStudentId])

  // Auto-select category when initialCategoryId is provided and fees are loaded
  useEffect(() => {
    if (initialCategoryId && pendingFees.length > 0 && !selectedAssignmentId) {
      setSelectedAssignmentId(initialCategoryId)
    }
  }, [initialCategoryId, pendingFees, selectedAssignmentId])

  const handleStudentChange = async (studentId: string, isInitial: boolean = false) => {
    setSelectedStudentId(studentId)
    // Only reset assignment if not initial load
    if (!isInitial) {
      setSelectedAssignmentId("")
    }
    setPaymentAmount("")
    setPendingFees([])

    if (!studentId) return

    try {
      setLoadingFees(true)
      // Fetch all pending fees including deallocated categories
      const fees = await getStudentPendingFees(studentId, true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPendingFees(fees as any)

      if (fees.length === 0 && !isInitial) {
        toast.info("This student has no pending fees")
      }
    } catch (error) {
      console.error("Error fetching pending fees:", error)
      toast.error("Failed to load pending fees")
    } finally {
      setLoadingFees(false)
    }
  }

  const handleAssignmentSelect = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId)
    setPaymentAmount("")
  }

  const selectedAssignment = pendingFees.find(f => f.id === selectedAssignmentId)

  const handleSubmit = async () => {
    // Check if student is selected
    if (!selectedStudentId) {
      toast.error("Please select a student")
      return
    }

    // Check if there are no pending fees
    if (pendingFees.length === 0) {
      toast.error("No pending fees available for this student")
      return
    }

    if (!selectedAssignmentId) {
      toast.error("Please select a category")
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

    if (selectedAssignment && amount > selectedAssignment.remaining) {
      toast.error(`Payment amount exceeds remaining balance (NPR ${selectedAssignment.remaining.toLocaleString()})`)
      return
    }

    setIsSubmitting(true)

    try {
      // Store as date-only (YYYY-MM-DD) to avoid timezone shifts
      const paymentDateStr = convertDateToYYYYMMDD(paymentDate)
      const result = await addPayment(
        selectedAssignmentId,
        amount,
        paymentDateStr,
        paymentMethod,
        referenceNumber || null,
        notes || null
      )

      if (result.success) {
        toast.success("Payment added successfully!")
        onSuccess()
        handleClose()
      } else {
        toast.error(result.error || "Failed to add payment")
      }
    } catch (error) {
      console.error("Error adding payment:", error)
      toast.error("An error occurred while adding payment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedStudentId(initialStudentId || "")
    setPendingFees([])
    setSelectedAssignmentId(initialCategoryId || "")
    setPaymentAmount("")
    setPaymentDate(new Date())
    setPaymentMethod("")
    setReferenceNumber("")
    setNotes("")
    onClose()
  }


  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl h-full overflow-y-auto p-4">
        <SheetHeader className="mb-6 p-0">
          <SheetTitle>Add Payment</SheetTitle>
          <SheetDescription>
            Select a student and category to record a payment
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label>Select Student</Label>
            <StudentSelectorOptimized
              value={selectedStudentId}
              onValueChange={handleStudentChange}
              disabled={isSubmitting}
              placeholder="Search and select a student..."
              showAvatar={true}
              showEmail={true}
              showPhone={false}
            />
          </div>

          {/* Loading Pending Fees */}
          {loadingFees && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading pending fees...</span>
            </div>
          )}

          {/* Category Selection */}
          {!loadingFees && selectedStudentId && pendingFees.length > 0 && (
            <div className="space-y-2">
              <Label>Select Category with Pending Balance</Label>
              <CategorySelectorOptimized
                value={selectedAssignmentId}
                onValueChange={handleAssignmentSelect}
                categories={pendingFees}
                disabled={isSubmitting}
                placeholder="Search and select a category..."
                loading={loadingFees}
              />
            </div>
          )}

          {/* No Pending Fees */}
          {!loadingFees && selectedStudentId && pendingFees.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This student has no pending fees. All categories are fully paid.
              </AlertDescription>
            </Alert>
          )}

          {/* Fee Summary */}
          {selectedAssignment && (
            <div className="p-3 bg-muted/40 rounded border border-border/50 space-y-2">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Final Fee</p>
                  <p className="font-semibold text-sm">NPR {selectedAssignment.finalFee.toLocaleString()}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Total Paid</p>
                  <p className="font-semibold text-sm text-green-600">NPR {selectedAssignment.totalPaid.toLocaleString()}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Remaining</p>
                  <p className="font-bold text-sm text-red-600">NPR {selectedAssignment.remaining.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Details */}
          {selectedAssignment && (
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Max: NPR {selectedAssignment.remaining.toLocaleString()}
                    </p>
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
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Adding Payment...
              </>
            ) : (
              <>
                Add Payment
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
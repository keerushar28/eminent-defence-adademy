'use client'

import { Button } from "@/features/core/components/button"
import { Loader2, AlertTriangle, UserX } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/features/core/components/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/features/core/components/alert"
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { deallocateStudent } from "../../actions/allocation-actions"
import { Allocation, DeallocationWarning } from "../../types/hostel.types"
import { calculatePendingDays, calculatePendingAmount } from "../../lib/calculations"
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date"

interface DeallocationDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  allocation: Allocation | null
}

export default function DeallocationDialog({
  isOpen,
  onClose,
  onSuccess,
  allocation,
}: DeallocationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [warning, setWarning] = useState<DeallocationWarning | null>(null)
  const [deallocationDate, setDeallocationDate] = useState<Date | undefined>(undefined)

  // Calculate pending fees when allocation changes
  useEffect(() => {
    if (allocation && isOpen) {
      const currentDate = deallocationDate || new Date()
      const effectivePrice = allocation.bed?.pricePerDay || 0
      const pendingDays = calculatePendingDays(new Date(allocation.paidUntil), currentDate, new Date(allocation.allocationDate))
      const pendingAmount = calculatePendingAmount(pendingDays, effectivePrice)

      if (pendingAmount > 0) {
        setWarning({
          hasWarning: true,
          pendingAmount,
          message: `Student has pending fees of NPR ${pendingAmount.toFixed(2)} for ${pendingDays} day(s). This amount will remain on record.`,
        })
      } else {
        setWarning(null)
      }
    } else {
      setWarning(null)
    }
  }, [allocation, isOpen, deallocationDate])

  const handleDeallocate = async () => {
    if (!allocation || isSubmitting) return

    setIsSubmitting(true)

    try {
      const result = await deallocateStudent(allocation.id, deallocationDate)

      toast.success("Student Deallocated Successfully! ✓", {
        description: `${allocation.student?.fullname || 'Student'} has been deallocated from the bed.`,
        duration: 5000,
      })

      // Show warning toast if there were pending fees
      if (result.warning?.hasWarning) {
        toast.warning("Pending Fees Recorded", {
          description: result.warning.message,
          duration: 7000,
        })
      }

      onSuccess()
    } catch (error) {
      console.error("Deallocation error:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      
      toast.error("Failed to Deallocate Student ❌", {
        description: errorMessage,
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setWarning(null)
    setDeallocationDate(undefined)
    onClose()
  }

  if (!allocation) return null

  const studentName = ((allocation.student as unknown as Record<string, unknown>)?.fullname as string) || "Unknown Student"
  const roomNumber = ((allocation.bed as unknown as Record<string, unknown>)?.room as Record<string, unknown>)?.roomNumber as string || "N/A"
  const bedNumber = (allocation.bed as unknown as Record<string, unknown>)?.bedNumber as string || "N/A"
  const allocationDate = formatNepaliDateFromDate(new Date(allocation.allocationDate))
  const paidUntil = formatNepaliDateFromDate(new Date(allocation.paidUntil))

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <UserX className="h-6 w-6 text-red-600" />
            Deallocate Student
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Are you sure you want to deallocate this student? This action will free up the bed for new allocations.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Allocation Details */}
          <div className="p-5 border rounded-md bg-muted/30">
            <h4 className="font-semibold mb-4 text-base">Allocation Details</h4>
            <div className="space-y-3 text-base">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Student:</span>
                <span className="font-medium">{studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Room:</span>
                <span className="font-medium">{roomNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bed:</span>
                <span className="font-medium">{bedNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Allocated On:</span>
                <span className="font-medium">{allocationDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid Until:</span>
                <span className="font-medium">{paidUntil}</span>
              </div>
            </div>
          </div>

          {/* Deallocation Date Picker */}
          <div className="p-5 border rounded-md bg-muted/30">
            <h4 className="font-semibold mb-4 text-base">Deallocation Date</h4>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Select the date when the student will be deallocated (defaults to today)
              </label>
              <NepaliDatePicker
                value={deallocationDate}
                onChange={(date) => setDeallocationDate(date as Date)}
                mode="single"
                placeholder="Pick a deallocation date"
                className="w-full"
              />
            </div>
          </div>

          {/* Pending Fee Warning */}
          {warning?.hasWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="text-base">Pending Fees Detected</AlertTitle>
              <AlertDescription className="mt-3">
                <div className="space-y-3">
                  <p className="text-base">{warning.message}</p>
                  <div className="p-4 bg-background/50 rounded-md mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-medium">Pending Amount:</span>
                      <span className="text-xl font-bold">NPR {warning.pendingAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-sm mt-3">
                    The pending amount will be recorded in the system and can be collected later.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* No Pending Fees Message */}
          {!warning?.hasWarning && (
            <Alert>
              <AlertDescription className="text-base">
                No pending fees. The student&apos;s payment is up to date.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="h-11 text-base"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeallocate}
            disabled={isSubmitting}
            className="h-11 text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Deallocating...
              </>
            ) : (
              <>
                <UserX className="h-5 w-5 mr-2" />
                Deallocate Student
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

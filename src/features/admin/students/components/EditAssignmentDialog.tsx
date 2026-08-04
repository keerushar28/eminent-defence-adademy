'use client'

import { useState, useEffect } from "react"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/core/components/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/core/components/select"
import { Button } from "@/features/core/components/button"
import { Label } from "@/features/core/components/label"
import { Input } from "@/features/core/components/input"
import { Textarea } from "@/features/core/components/textarea"
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker"
import { IStudent } from "../types/types"
import { updateCategoryAssignment } from "../actions/category-assignment-actions"

interface EditAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: IStudent | null
}

export default function EditAssignmentDialog({
  open,
  onOpenChange,
  student,
}: EditAssignmentDialogProps) {
  const router = useRouter()
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("")
  const [assignedDate, setAssignedDate] = useState<Date | undefined>()
  const [discountAmount, setDiscountAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activeAssignments = student?.studentCategories?.filter(sc => sc.isActive) ?? []

  const selectedAssignment = activeAssignments.find(sc => sc.id === selectedAssignmentId)

  // Populate fields when assignment is selected
  useEffect(() => {
    if (selectedAssignment) {
      setAssignedDate(
        selectedAssignment.assignedDate ? new Date(selectedAssignment.assignedDate) : undefined
      )
      setDiscountAmount(String(Number(selectedAssignment.discountAmount ?? 0)))
      setNotes(selectedAssignment.notes ?? "")
    }
  }, [selectedAssignmentId])

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedAssignmentId("")
      setAssignedDate(undefined)
      setDiscountAmount("")
      setNotes("")
    }
  }, [open])

  const handleSubmit = async () => {
    if (!selectedAssignmentId) {
      toast.error("Please select an assignment to edit")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await updateCategoryAssignment(selectedAssignmentId, {
        assignedDate,
        discountAmount: discountAmount !== "" ? Number(discountAmount) : undefined,
        notes: notes || undefined,
      })

      if (result.success) {
        toast.success("Assignment updated successfully")
        router.refresh()
        onOpenChange(false)
      } else {
        toast.error(result.error || "Failed to update assignment")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogDescription>
            {student?.fullname} — select an assignment then update its details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Assignment selector */}
          <div className="space-y-1.5">
            <Label>Assignment <span className="text-red-500">*</span></Label>
            <Select
              value={selectedAssignmentId}
              onValueChange={setSelectedAssignmentId}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an assignment..." />
              </SelectTrigger>
              <SelectContent>
                {activeAssignments.map(sc => (
                  <SelectItem key={sc.id} value={sc.id}>
                    {sc.subCategory?.category?.name} — {sc.subCategory?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAssignment && (
            <>
              {/* Assigned Date */}
              <div className="space-y-1.5">
                <Label>Assigned Date</Label>
                <NepaliDatePicker
                  value={assignedDate}
                  onChange={(d) => setAssignedDate(d as Date)}
                  placeholder="Select assigned date"
                />
              </div>

              {/* Discount Amount */}
              <div className="space-y-1.5">
                <Label>Discount Amount (NPR)</Label>
                <Input
                  type="number"
                  min={0}
                  max={Number(selectedAssignment.subCategory?.fee ?? 0)}
                  value={discountAmount}
                  onChange={e => setDiscountAmount(e.target.value)}
                  placeholder="0"
                  disabled={isSubmitting}
                />
                {discountAmount !== "" && (
                  <p className="text-xs text-muted-foreground">
                    Final fee: NPR{" "}
                    {Math.max(
                      0,
                      Number(selectedAssignment.subCategory?.fee ?? 0) - Number(discountAmount)
                    ).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedAssignmentId}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/features/core/components/button"
import { Input } from "@/features/core/components/input"
import { Badge } from "@/features/core/components/badge"
import { Card, CardContent } from "@/features/core/components/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/features/core/components/sheet"
import { Loader2, Plus, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { assignCategoriesToStudent, CategoryAssignment, getStudentCategoryAssignments } from "../actions/category-assignment-actions"
import StudentSelectorOptimized from "@/features/admin/components/StudentSelectorOptimized"
import { useCategoryAssignment } from "@/features/admin/students/hooks/useCategoryAssignment"
import { CategoryAssignmentList } from "./CategoryAssignmentList"
import { IStudent } from "../types/types"
import { Label } from "@/features/core/components/label"
import { Checkbox } from "@/features/core/components/checkbox"
import {
  Collapsible, CollapsibleContent,
  CollapsibleTrigger
} from "@/features/core/components/collapsible"
import { ChevronDown, ChevronRight, Users } from "lucide-react"
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/features/core/components/tooltip"

interface AssignCategoriesProps {
  students: IStudent[]
  initialStudentId?: string
  initialStudentName?: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  existingAssignments?: Array<{
    subCategoryId: string
    discountAmount: number
    assignedDate?: Date
    durationMonths?: number
  }>
}

// interfaces for AssignmentData, etc. can be imported or inferred from hook
import { AssignmentData } from "@/features/admin/students/hooks/useCategoryAssignment"

export default function AssignCategories({
  students,
  initialStudentId,
  initialStudentName,
  isOpen,
  onClose,
  onSuccess,
  existingAssignments = []
}: AssignCategoriesProps) {
  // Initialize hook
  const assignHook = useCategoryAssignment({
    initialAssignments: existingAssignments.map(a => ({
      subCategoryId: a.subCategoryId,
      discountAmount: a.discountAmount,
      assignedDate: a.assignedDate,
      durationMonths: a.durationMonths,
      notes: "" // Notes not currently in existingAssignments interface but hook supports it
    }))
  })

  // Container state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || "")
  const [alreadyAssignedSubCategoryIds, setAlreadyAssignedSubCategoryIds] = useState<Set<string>>(new Set())
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)

  // Destructure what we need for submission
  const {
    selectedSubCategoryIds,
    discounts,
    assignedDates,
    durations,
    notes,
    validationResults,
    isFormValid,
    totalOriginalFee,
    totalDiscount,
    totalFinalFee,
    resetForm
  } = assignHook

  // Update selected student when initialStudentId changes
  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId)
    }
  }, [initialStudentId])

  // Fetch already-assigned categories when student changes
  useEffect(() => {
    if (selectedStudentId) {
      setIsLoadingAssignments(true)
      getStudentCategoryAssignments(selectedStudentId)
        .then((assignments) => {
          const activeAssignedIds = new Set(
            assignments
              .filter(a => a.isActive)
              .map(a => a.subCategory?.id)
              .filter(Boolean) as string[]
          )
          setAlreadyAssignedSubCategoryIds(activeAssignedIds)
        })
        .catch((error) => {
          console.error("Error fetching assignments:", error)
          setAlreadyAssignedSubCategoryIds(new Set())
        })
        .finally(() => setIsLoadingAssignments(false))
    } else {
      setAlreadyAssignedSubCategoryIds(new Set())
    }
  }, [selectedStudentId])

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen, resetForm])

  // Get selected student details
  const selectedStudent = students.find(s => s.id === selectedStudentId)
  const studentName = selectedStudent?.fullname || initialStudentName || "No student selected"

  const handleSubmit = async () => {
    if (!selectedStudentId) {
      toast.error("Please select a student")
      return
    }

    if (!isFormValid) {
      toast.error("Please fix validation errors")
      return
    }

    setIsSubmitting(true)

    try {
      const assignments: CategoryAssignment[] = validationResults.map(r => ({
        subCategoryId: r.subCategoryId,
        discountAmount: r.discount,
        assignedDate: assignedDates[r.subCategoryId],
        durationMonths: durations[r.subCategoryId] ? parseInt(durations[r.subCategoryId]) : undefined,
        notes: notes[r.subCategoryId] || undefined
      }))

      const result = await assignCategoriesToStudent(selectedStudentId, assignments)

      if (result.success) {
        if (result.alreadyAssigned && result.alreadyAssigned.length > 0) {
          toast.warning(result.message || "Some categories were already assigned")
        } else {
          toast.success("Categories assigned successfully!")
        }
        onSuccess()
        onClose()
      } else {
        toast.error(result.error || "Failed to assign categories")
      }
    } catch (error) {
      console.error("Error assigning categories:", error)
      toast.error("An error occurred while assigning categories")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl h-full flex flex-col p-0">
        <div className="sticky top-0 z-10 bg-background border-b">
          <SheetHeader className="p-6 pb-4">
            <SheetTitle className="text-xl">Assign Categories</SheetTitle>
            <SheetDescription className="text-base">
              Assign categories to <span className="font-semibold text-foreground">{studentName}</span> with optional discount amounts
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Student Selector */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Student Selection</Label>
            <StudentSelectorOptimized
              value={selectedStudentId}
              onValueChange={setSelectedStudentId}
              disabled={isSubmitting}
              placeholder="Choose a student to assign categories..."
              showAvatar={true}
              showEmail={true}
              showPhone={false}
              showCategories={true}
            />
          </div>

          {/* Category Selector with Inline Discounts */}
          {selectedStudentId ? (
            <CategoryAssignmentList
              assignHook={assignHook}
              alreadyAssignedSubCategoryIds={alreadyAssignedSubCategoryIds}
              isSubmitting={isSubmitting}
              isLoadingAssignments={isLoadingAssignments}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Please select a student to view categories</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-background border-t p-6 flex flex-col gap-2">
          {selectedSubCategoryIds.length > 0 && (

            <div className="border p-2 rounded flex flex-col gap-3">
              <h1 className="text-base font-semibold">Fees Summary</h1>
              <div className="flex justify-between text-sm">
                <p className="font-medium">Original Total</p>
                <p className="font-semibold">NPR {totalOriginalFee.toLocaleString()}</p>
              </div>
              <div className="flex justify-between text-sm">
                <p className="font-medium">Total Discount</p>
                <p className="text-destructive font-semibold">- NPR {totalDiscount.toLocaleString()}</p>
              </div>  <div className="flex justify-between text-sm">
                <p className="font-medium">Final Amount</p>
                <p className="font-semibold text-primary">NPR {totalFinalFee.toLocaleString()}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              size="lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !isFormValid || !selectedStudentId}
              size="lg"
              className="min-w-40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Assigning...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Categories
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
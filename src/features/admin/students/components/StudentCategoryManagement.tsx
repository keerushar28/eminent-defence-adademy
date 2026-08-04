'use client'

import { useState, useEffect } from "react"
import { Button } from "@/features/core/components/button"
import { Badge } from "@/features/core/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/features/core/components/card"
import { Loader2, Plus, Trash2, CheckCircle, AlertCircle, FolderOpen, FileText } from "lucide-react"
import { toast } from "sonner"
import {
  getStudentCategoryAssignments,
  removeStudentCategory
} from "../actions/category-assignment-actions"
import AssignCategories from "./AssignCategories"
import AddPaymentDialog from "@/features/admin/payments/components/AddPaymentDialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/features/core/components/alert-dialog"
import EmptyState from "../../inventory/components/shared/EmptyState"
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date"

interface StudentCategoryManagementProps {
  studentId: string
  studentName: string
  /** Increment this to force re-fetch of assignments */
  refreshTrigger?: number
}

interface StudentCategoryAssignment {
  id: string
  discountAmount: number
  finalFee: number
  totalPaid: number
  assignedAt: Date
  isActive: boolean
  checkedOutAt: Date | null
  subCategory: {
    id: string
    name: string
    fee: number
    category: {
      id: string
      name: string
    }
  }
  payments: Array<{
    id: string
    amount: number
    paymentDate: Date
    paymentMethod: string
    referenceNumber: string | null
    notes: string | null
  }>
}

export default function StudentCategoryManagement({
  studentId,
  studentName,
  refreshTrigger = 0
}: StudentCategoryManagementProps) {
  const [assignments, setAssignments] = useState<StudentCategoryAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<StudentCategoryAssignment | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedPaymentCategoryId, setSelectedPaymentCategoryId] = useState<string>("")
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const data = await getStudentCategoryAssignments(studentId)
      setAssignments(data as StudentCategoryAssignment[])
    } catch (error) {
      console.error("Error fetching assignments:", error)
      toast.error("Failed to load category assignments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [studentId, refreshTrigger])

  const handleRemoveAssignment = async () => {
    if (!selectedAssignment) return

    setIsDeleting(true)

    try {
      const result = await removeStudentCategory(selectedAssignment.id)

      if (result.success) {
        toast.success("Category de-allocated successfully")
        fetchAssignments()
      } else {
        toast.error(result.error || "Failed to de-allocate category")
      }
    } catch (error) {
      console.error("Error removing category:", error)
      toast.error("An error occurred")
    } finally {
      setDeleteDialogOpen(false)
      setSelectedAssignment(null)
      setIsDeleting(false)
    }
  }

  const openDeleteDialog = (assignment: StudentCategoryAssignment) => {
    setSelectedAssignment(assignment)
    setDeleteDialogOpen(true)
  }

  const getPaymentStatus = (finalFee: number, totalPaid: number) => {
    const remaining = finalFee - totalPaid

    if (remaining <= 0) {
      return { status: "Paid", color: "bg-green-500", icon: CheckCircle }
    } else if (totalPaid > 0) {
      return { status: "Partial", color: "bg-yellow-500", icon: AlertCircle }
    } else {
      return { status: "Unpaid", color: "bg-red-500", icon: AlertCircle }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading category assignments...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Category Assignments</h3>
        <Button size="sm" onClick={() => setIsAssignOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Assign
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      ) : assignments.length === 0 ? (
        <div className="p-6 border rounded-lg bg-card text-center">
          <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">No categories assigned</p>
          <p className="text-xs text-muted-foreground mt-1">Assign categories to track payments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const paymentStatus = getPaymentStatus(
              Number(assignment.finalFee),
              Number(assignment.totalPaid)
            )
            const remaining = Number(assignment.finalFee) - Number(assignment.totalPaid)

            return (
              <div key={assignment.id} className={`p-4 border rounded-lg bg-card ${!assignment.isActive ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">
                        {assignment.subCategory.category.name} - {assignment.subCategory.name}
                      </h4>
                      {!assignment.isActive && (
                        <Badge variant="destructive" className="text-xs">De-allocated</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Assigned {formatNepaliDateFromDate(new Date(assignment.assignedAt))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${paymentStatus.color}`} />
                      {paymentStatus.status}
                    </Badge>
                    {assignment.isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openDeleteDialog(assignment)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Fee Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                  <div>
                    <p className="text-muted-foreground">Original</p>
                    <p className="font-semibold">NPR {Number(assignment.subCategory.fee).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Discount</p>
                    <p className="font-semibold text-orange-600">-NPR {Number(assignment.discountAmount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Final</p>
                    <p className="font-semibold">NPR {Number(assignment.finalFee).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Paid</p>
                    <p className="font-semibold text-green-600">NPR {Number(assignment.totalPaid).toLocaleString()}</p>
                  </div>
                </div>

                {/* Remaining Balance */}
                {remaining > 0 && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className="font-semibold text-red-600">NPR {remaining.toLocaleString()}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPaymentCategoryId(assignment.id)
                        setPaymentDialogOpen(true)
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Payment
                    </Button>
                  </div>
                )}

                {/* Payment History */}
                {assignment.payments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Payments</p>
                    <div className="space-y-1">
                      {assignment.payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                          <div>
                            <p className="font-medium">NPR {Number(payment.amount).toLocaleString()}</p>
                            <p className="text-muted-foreground">
                              {formatNepaliDateFromDate(new Date(payment.paymentDate))} • {payment.paymentMethod}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Assign Categories Dialog */}
      <AssignCategories
        students={[]}
        initialStudentId={studentId}
        initialStudentName={studentName}
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onSuccess={fetchAssignments}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>De-allocate Category?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAssignment && (
                <div className="space-y-3 mt-2">
                  <p>
                    De-allocate <span className="font-semibold">{selectedAssignment.subCategory.category.name} - {selectedAssignment.subCategory.name}</span>?
                  </p>
                  
                  {Number(selectedAssignment.finalFee) - Number(selectedAssignment.totalPaid) > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Pending Balance
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        NPR {(Number(selectedAssignment.finalFee) - Number(selectedAssignment.totalPaid)).toLocaleString()} remaining
                      </p>
                    </div>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveAssignment} 
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Removing...
                </>
              ) : (
                'De-allocate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Payment Dialog */}
      <AddPaymentDialog
        isOpen={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false)
          setSelectedPaymentCategoryId("")
        }}
        onSuccess={() => {
          setPaymentDialogOpen(false)
          setSelectedPaymentCategoryId("")
          fetchAssignments()
        }}
        initialStudentId={studentId}
        initialCategoryId={selectedPaymentCategoryId}
      />
    </div>
  )
}

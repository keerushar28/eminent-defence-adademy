'use client'

import { useState, useEffect } from "react"
import { Loader2, AlertCircle, ArrowRight } from "lucide-react"
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
import { Input } from "@/features/core/components/input"
import { Textarea } from "@/features/core/components/textarea"
import { Label } from "@/features/core/components/label"
import { Badge } from "@/features/core/components/badge"
import { toast } from "sonner"
import { transferStudentCategory } from "../actions/category-assignment-actions"
import { useRouter } from "next/navigation"

import { IStudent } from "../types/types"

interface TransferCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: IStudent | null
  availableCategories: Array<{
    id: string
    name: string
    subCategories: Array<{
      id: string
      name: string
      fee: number
    }>
  }>
}

const RETURN_TYPES = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "ONLINE", label: "Online Payment" },
  { value: "CARD", label: "Card" },
]

export default function TransferCategoryDialog({
  open,
  onOpenChange,
  student,
  availableCategories,
}: TransferCategoryDialogProps) {
  const router = useRouter()
  const [selectedFromCategoryId, setSelectedFromCategoryId] = useState<string>("")
  const [selectedToCategoryId, setSelectedToCategoryId] = useState<string>("")
  const [selectedToSubCategoryId, setSelectedToSubCategoryId] = useState<string>("")
  const [returnType, setReturnType] = useState<string>("")
  const [confirmationText, setConfirmationText] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isTransferring, setIsTransferring] = useState(false)

  // Get active categories for the student
  const activeCategories = student?.studentCategories?.filter(sc => sc.isActive) || []

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedFromCategoryId("")
      setSelectedToCategoryId("")
      setSelectedToSubCategoryId("")
      setReturnType("")
      setConfirmationText("")
      setNotes("")
    } else if (activeCategories.length === 1) {
      // Auto-select if only one active category
      setSelectedFromCategoryId(activeCategories[0].id)
    }
  }, [open, activeCategories.length])

  const selectedFromCategory = activeCategories.find(c => c.id === selectedFromCategoryId)
  const selectedToCategory = availableCategories.find(c => c.id === selectedToCategoryId)
  const selectedToSubCategory = selectedToCategory?.subCategories.find(
    sc => sc.id === selectedToSubCategoryId
  )

  const totalPaid = Number(selectedFromCategory?.totalPaid || 0)
  const newCategoryFee = selectedToSubCategory?.fee || 0
  const overpayment = totalPaid - newCategoryFee
  const hasOverpayment = overpayment > 0

  // Calculate amounts
  const returnAmount = Math.max(0, overpayment)
  const transferAmount = Math.min(totalPaid, newCategoryFee)
  
  // Required confirmation text
  const requiredConfirmation = hasOverpayment ? `RETURNED ${Math.round(returnAmount)}` : ""

  const isValidTransfer = () => {
    if (!selectedFromCategoryId || !selectedToSubCategoryId) return false
    if (hasOverpayment && !returnType) return false
    if (hasOverpayment && confirmationText !== requiredConfirmation) return false
    return true
  }

  const handleTransfer = async () => {
    if (!student || !isValidTransfer()) return

    setIsTransferring(true)

    try {
      const result = await transferStudentCategory({
        fromStudentCategoryId: selectedFromCategoryId,
        toSubCategoryId: selectedToSubCategoryId,
        returnType: returnType || undefined,
        notes: notes.trim() || undefined,
      })

      if (result.success) {
        toast.success(result.message || "Category transferred successfully")
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to transfer category")
      }
    } catch (error) {
      console.error("Error transferring category:", error)
      toast.error("An error occurred while transferring category")
    } finally {
      setIsTransferring(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transfer Category</DialogTitle>
          <DialogDescription>
            Transfer {student?.fullname} from one category to another. All payment records will be transferred.
          </DialogDescription>
        </DialogHeader>

        {student && (
          <div className="space-y-6">
            {/* From Category Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Transfer From
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromCategory">
                  Current Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedFromCategoryId}
                  onValueChange={setSelectedFromCategoryId}
                  disabled={isTransferring || activeCategories.length === 1}
                >
                  <SelectTrigger id="fromCategory">
                    <SelectValue placeholder="Select current category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.subCategory?.category?.name} - {category.subCategory?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedFromCategory && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Current Category Details</p>
                    <Badge variant="outline">
                      {selectedFromCategory.subCategory?.category?.name} - {selectedFromCategory.subCategory?.name}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Final Fee</p>
                      <p className="font-semibold">NPR {Number(selectedFromCategory.finalFee || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Paid</p>
                      <p className="font-semibold text-green-600">NPR {totalPaid.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Balance</p>
                      <p className={`font-semibold ${totalPaid - Number(selectedFromCategory.finalFee || 0) > 0 ? 'text-blue-600' : totalPaid - Number(selectedFromCategory.finalFee || 0) < 0 ? 'text-red-600' : ''}`}>
                        NPR {Math.abs(totalPaid - Number(selectedFromCategory.finalFee || 0)).toLocaleString()}
                        {totalPaid - Number(selectedFromCategory.finalFee || 0) > 0 ? ' (Overpaid)' : totalPaid - Number(selectedFromCategory.finalFee || 0) < 0 ? ' (Pending)' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Transfer To */}
            {selectedFromCategory && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Transfer To
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="toCategory">
                        Category <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={selectedToCategoryId}
                        onValueChange={(value) => {
                          setSelectedToCategoryId(value)
                          setSelectedToSubCategoryId("")
                        }}
                        disabled={isTransferring}
                      >
                        <SelectTrigger id="toCategory">
                          <SelectValue placeholder="Select category..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="toSubcategory">
                        Sub-Category <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={selectedToSubCategoryId}
                        onValueChange={setSelectedToSubCategoryId}
                        disabled={!selectedToCategoryId || isTransferring}
                      >
                        <SelectTrigger id="toSubcategory">
                          <SelectValue placeholder="Select sub-category..." />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedToCategory?.subCategories
                            .filter(sc => sc.id !== selectedFromCategory?.subCategory?.id)
                            .map((subCategory) => (
                              <SelectItem key={subCategory.id} value={subCategory.id}>
                                {subCategory.name} (NPR {subCategory.fee.toLocaleString()})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedToSubCategory && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm font-semibold text-green-800">New Category Fee</p>
                      <p className="text-sm text-green-700 mt-1">
                        NPR {selectedToSubCategory.fee.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Overpayment Alert */}
                {selectedToSubCategory && hasOverpayment && (
                  <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5 shrink-0" />
                    <div className="space-y-2 flex-1">
                      <p className="font-semibold text-amber-900 text-base">Overpayment Detected!</p>
                      <p className="text-sm text-amber-800">
                        The student has paid NPR {totalPaid.toLocaleString()} but the new category fee is only NPR {newCategoryFee.toLocaleString()}.
                        This results in an overpayment of NPR {overpayment.toLocaleString()}.
                      </p>
                      <p className="text-sm font-semibold text-amber-900">
                        You must specify how much to return to the student and the return method.
                      </p>
                    </div>
                  </div>
                )}

                {/* Return Amount & Type */}
                {selectedToSubCategory && hasOverpayment && (
                  <div className="space-y-4 p-4 bg-gray-50 border rounded-lg">
                    <p className="text-sm font-semibold text-blue-900">Return Details (Required)</p>
                    
                    <div className="space-y-4">
                      <div className="p-3 bg-white border border-blue-300 rounded">
                        <p className="text-sm font-semibold text-blue-900">Automatic Calculation</p>
                        <div className="text-sm text-blue-800 mt-2 space-y-1">
                          <p>• Student paid: NPR {totalPaid.toLocaleString()}</p>
                          <p>• New category fee: NPR {newCategoryFee.toLocaleString()}</p>
                          <p className="font-semibold text-red-600">• Amount to return: NPR {returnAmount.toLocaleString()}</p>
                          <p>• Amount to transfer: NPR {transferAmount.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="returnType">
                          Return Method <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={returnType}
                          onValueChange={setReturnType}
                          disabled={isTransferring}
                        >
                          <SelectTrigger id="returnType">
                            <SelectValue placeholder="Select return method..." />
                          </SelectTrigger>
                          <SelectContent>
                            {RETURN_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmText">
                          Type "{requiredConfirmation}" to confirm <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="confirmText"
                          type="text"
                          placeholder={`Type: ${requiredConfirmation}`}
                          value={confirmationText}
                          onChange={(e) => setConfirmationText(e.target.value)}
                          disabled={isTransferring}
                          className={confirmationText && confirmationText !== requiredConfirmation ? 'border-red-500' : ''}
                        />
                        {confirmationText && confirmationText !== requiredConfirmation && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Please type exactly: "{requiredConfirmation}"
                          </p>
                        )}
                        {confirmationText === requiredConfirmation && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            ✓ Confirmation verified
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Transfer Summary for non-overpayment */}
                {selectedToSubCategory && !hasOverpayment && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm font-semibold text-blue-800">Transfer Summary</p>
                    <div className="text-sm text-blue-700 mt-2 space-y-1">
                      <p>• Total amount to transfer: NPR {totalPaid.toLocaleString()}</p>
                      <p>• New category fee: NPR {newCategoryFee.toLocaleString()}</p>
                      <p>• Balance after transfer: NPR {Math.abs(totalPaid - newCategoryFee).toLocaleString()} {totalPaid >= newCategoryFee ? '(Paid in full)' : '(Pending)'}</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional notes about this transfer..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isTransferring}
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isTransferring}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!isValidTransfer() || isTransferring}
          >
            {isTransferring ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Transferring...
              </>
            ) : (
              'Transfer Category'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

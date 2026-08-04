'use client'

import { useState } from "react"
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
import { Loader2, AlertCircle, Package, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/features/core/components/alert"
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker"
import StudentSelectorOptimized from "@/features/admin/components/StudentSelectorOptimized"
import { getIssuances } from "../actions/issuance-actions"
import { createIssuancePayment } from "../actions/issuance-payment-actions"
import { IStudentIssuance } from "../types/inventory-types"
import { Badge } from "@/features/core/components/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/core/components/popover"
import { ScrollArea } from "@/features/core/components/scroll-area"
import { cn } from "@/features/core/lib/utils"

interface AddIssuancePaymentSheetProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddIssuancePaymentSheet({
  isOpen,
  onClose,
  onSuccess,
}: AddIssuancePaymentSheetProps) {
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [issuances, setIssuances] = useState<IStudentIssuance[]>([])
  const [loadingIssuances, setLoadingIssuances] = useState(false)
  const [selectedIssuance, setSelectedIssuance] = useState<IStudentIssuance | null>(null)
  const [issuancePickerOpen, setIssuancePickerOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState<Date>(new Date())
  const [paymentMethod, setPaymentMethod] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleStudentChange = async (studentId: string) => {
    setSelectedStudentId(studentId)
    setSelectedIssuance(null)
    setIssuances([])
    setPaymentAmount("")

    if (!studentId) return

    setLoadingIssuances(true)
    try {
      const data = await getIssuances({ studentId })
      const withBalance = data.filter((i) => {
        const total = i.totalAmount ?? 0
        const paid = i.totalPaid ?? 0
        return total > paid
      })
      setIssuances(withBalance)
    } catch {
      toast.error("Failed to load issuances")
    } finally {
      setLoadingIssuances(false)
    }
  }

  const handleClose = () => {
    setSelectedStudentId("")
    setIssuances([])
    setSelectedIssuance(null)
    setPaymentAmount("")
    setPaymentDate(new Date())
    setPaymentMethod("")
    setReferenceNumber("")
    setNotes("")
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIssuance || !paymentMethod || !paymentAmount) return

    const amount = parseFloat(paymentAmount)
    const remaining = (selectedIssuance.totalAmount ?? 0) - (selectedIssuance.totalPaid ?? 0)

    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    if (amount > remaining) {
      toast.error(`Amount exceeds remaining balance of NPR ${remaining.toFixed(2)}`)
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("amount", amount.toString())
      formData.append("paymentDate", paymentDate.toISOString())
      formData.append("paymentMethod", paymentMethod)
      formData.append("referenceNumber", referenceNumber)
      formData.append("notes", notes)

      const result = await createIssuancePayment(selectedIssuance.id, formData)

      if (result.success) {
        toast.success("Payment recorded successfully")
        handleClose()
        onSuccess()
      } else {
        toast.error(result.error || "Failed to record payment")
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const remaining = selectedIssuance
    ? (selectedIssuance.totalAmount ?? 0) - (selectedIssuance.totalPaid ?? 0)
    : 0

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-lg gap-0 pb-2 p-6 h-full font-medium overflow-y-auto">
        <SheetHeader className="mb-2 p-0 border-b pb-4 gap-0.5">
          <SheetTitle className="text-xl">Add Issuance Payment</SheetTitle>
          <SheetDescription className="text-sm font-normal">
            Select a student and their issuance to record a payment
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Step 1: Student */}
          <div className="space-y-2">
            <Label>Select Student <span className="text-red-500">*</span></Label>
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

          {/* Loading issuances */}
          {loadingIssuances && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading issuances...</span>
            </div>
          )}

          {/* Step 2: Issuance selector */}
          {!loadingIssuances && selectedStudentId && issuances.length > 0 && (
            <div className="space-y-2">
              <Label>Select Issuance <span className="text-red-500">*</span></Label>
              <Popover open={issuancePickerOpen} onOpenChange={setIssuancePickerOpen} modal>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-between h-auto min-h-[40px] py-2 px-3")}
                    disabled={isSubmitting}
                  >
                    {selectedIssuance ? (
                      <div className="flex items-center gap-2 text-left">
                        <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{selectedIssuance.item?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {selectedIssuance.quantity} · Remaining: NPR {((selectedIssuance.totalAmount ?? 0) - (selectedIssuance.totalPaid ?? 0)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Select an issuance...</span>
                    )}
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <ScrollArea className="max-h-64">
                    <div className="p-1 space-y-0.5">
                      {issuances.map((issuance) => {
                        const rem = (issuance.totalAmount ?? 0) - (issuance.totalPaid ?? 0)
                        return (
                          <button
                            key={issuance.id}
                            type="button"
                            onClick={() => {
                              setSelectedIssuance(issuance)
                              setPaymentAmount("")
                              setIssuancePickerOpen(false)
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2.5 rounded-md hover:bg-muted transition-colors",
                              selectedIssuance?.id === issuance.id && "bg-muted"
                            )}
                          >
                            <div className="flex justify-between items-center gap-2">
                              <div>
                                <p className="text-sm font-medium">{issuance.item?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {issuance.quantity} {issuance.item?.unit} · NPR {(issuance.unitPrice ?? 0).toFixed(2)} each
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs text-muted-foreground">Remaining</p>
                                <p className="text-sm font-semibold text-red-600">NPR {rem.toFixed(2)}</p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* No issuances with balance */}
          {!loadingIssuances && selectedStudentId && issuances.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This student has no issuances with outstanding balance.
              </AlertDescription>
            </Alert>
          )}

          {/* Step 3: Payment details */}
          {selectedIssuance && (
            <>
              {/* Issuance summary */}
              <div className="p-3 bg-muted/40 rounded border border-border/50 space-y-1.5">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-semibold text-sm">NPR {(selectedIssuance.totalAmount ?? 0).toFixed(2)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground">Paid</p>
                    <p className="font-semibold text-sm text-green-600">NPR {(selectedIssuance.totalPaid ?? 0).toFixed(2)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground">Remaining</p>
                    <p className="font-bold text-sm text-red-600">NPR {remaining.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (NPR) <span className="text-red-500">*</span></Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remaining}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">Max: NPR {remaining.toFixed(2)}</p>
              </div>

              {/* Payment Date */}
              <div className="space-y-2">
                <Label>Payment Date <span className="text-red-500">*</span></Label>
                <NepaliDatePicker
                  value={paymentDate}
                  onChange={(d) => { if (d instanceof Date) setPaymentDate(d) }}
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method <span className="text-red-500">*</span></Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={isSubmitting}>
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
              </div>

              {/* Reference */}
              <div className="space-y-2">
                <Label htmlFor="ref">Reference Number <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                <Input
                  id="ref"
                  placeholder="Transaction reference..."
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none min-h-20"
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedIssuance || !paymentMethod || !paymentAmount}
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Recording...</>
              ) : (
                "Record Payment"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

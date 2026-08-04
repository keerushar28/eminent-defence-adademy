'use client'

import { IIssuancePayment } from "../types/inventory-types"
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date"
import { Badge } from "@/features/core/components/badge"
import { Button } from "@/features/core/components/button"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { deleteIssuancePayment } from "../actions/issuance-payment-actions"

interface IssuancePaymentHistoryProps {
  payments: IIssuancePayment[]
  onPaymentDeleted?: () => void
}

const paymentMethodColors: Record<string, string> = {
  CASH: "bg-green-100 text-green-800",
  CARD: "bg-blue-100 text-blue-800",
  BANK_TRANSFER: "bg-purple-100 text-purple-800",
  CHEQUE: "bg-orange-100 text-orange-800",
  ONLINE: "bg-cyan-100 text-cyan-800",
}

export default function IssuancePaymentHistory({ 
  payments, 
  onPaymentDeleted 
}: IssuancePaymentHistoryProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Are you sure you want to delete this payment?")) {
      return
    }

    setIsDeleting(paymentId)
    try {
      const result = await deleteIssuancePayment(paymentId)
      if (result.success) {
        toast.success("Payment deleted successfully")
        onPaymentDeleted?.()
      } else {
        toast.error(result.error || "Failed to delete payment")
      }
    } catch (error) {
      console.error("Error deleting payment:", error)
      toast.error("An error occurred while deleting the payment")
    } finally {
      setIsDeleting(null)
    }
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No payments recorded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge className={paymentMethodColors[payment.paymentMethod] || "bg-gray-100 text-gray-800"}>
                {payment.paymentMethod}
              </Badge>
              <span className="font-semibold">NPR {payment.amount.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground">
                {formatNepaliDateFromDate(new Date(payment.paymentDate))}
              </span>
            </div>
            {payment.referenceNumber && (
              <div className="text-sm text-muted-foreground">
                Ref: {payment.referenceNumber}
              </div>
            )}
            {payment.notes && (
              <div className="text-sm text-muted-foreground mt-1">
                {payment.notes}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeletePayment(payment.id)}
            disabled={isDeleting === payment.id}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/core/components/card"
import { Badge } from "@/features/core/components/badge"
import { Separator } from "@/features/core/components/separator"
import { AlertCircle, CreditCard, Calendar, Bed, Receipt } from "lucide-react"
import { StudentFinancialView } from "../types/hostel.types"
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date"
import { useMemo } from "react"

interface StudentBillingCardProps {
  financialView: StudentFinancialView
  studentName?: string
}

export default function StudentBillingCard({ financialView, studentName }: StudentBillingCardProps) {
  const { allocations, totalPending, totalCredit, finalBalance } = financialView

  // Sort allocations: active first, then by allocation date descending
  const sortedAllocations = useMemo(() => {
    return [...allocations].sort((a, b) => {
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1
      }
      return new Date(b.allocationDate).getTime() - new Date(a.allocationDate).getTime()
    })
  }, [allocations])

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Student Billing Summary</CardTitle>
            {studentName && (
              <CardDescription className="mt-1">
                Financial overview for {studentName}
              </CardDescription>
            )}
          </div>
          <Badge 
            variant={finalBalance > 0 ? "destructive" : finalBalance < 0 ? "default" : "secondary"}
            className="text-base px-3 py-1"
          >
            {finalBalance > 0 ? 'Owes' : finalBalance < 0 ? 'Credit' : 'Balanced'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-md bg-destructive/10">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-muted-foreground">Total Pending</span>
            </div>
            <div className="text-2xl font-bold text-destructive">
              NPR {totalPending.toFixed(2)}
            </div>
          </div>

          <div className="p-4 border rounded-md bg-blue-50 dark:bg-blue-950/20">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-muted-foreground">Total Credits</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              NPR {totalCredit.toFixed(2)}
            </div>
          </div>

          <div className={`p-4 border rounded-md ${
            finalBalance > 0 
              ? 'bg-destructive/10' 
              : finalBalance < 0 
              ? 'bg-green-50 dark:bg-green-950/20' 
              : 'bg-muted/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">Final Balance</span>
            </div>
            <div className={`text-2xl font-bold ${
              finalBalance > 0 
                ? 'text-destructive' 
                : finalBalance < 0 
                ? 'text-green-600' 
                : ''
            }`}>
              NPR {Math.abs(finalBalance).toFixed(2)}
            </div>
          </div>
        </div>

        <Separator />

        {/* Allocations List */}
        <div>
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Bed className="h-4 w-4" />
            All Allocations ({allocations.length})
          </h4>
          
          {sortedAllocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No allocation history found
            </div>
          ) : (
            <div className="space-y-4">
              {sortedAllocations.map((allocation) => (
                <Card key={allocation.allocationId} className="border-l-4" style={{
                  borderLeftColor: allocation.isActive 
                    ? 'hsl(var(--primary))' 
                    : 'hsl(var(--muted))'
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          Room {allocation.roomNumber} - Bed {allocation.bedNumber}
                          {allocation.isActive && (
                            <Badge variant="default" className="text-xs">Active</Badge>
                          )}
                          {!allocation.isActive && (
                            <Badge variant="secondary" className="text-xs">Deallocated</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          NPR {allocation.pricePerDay.toFixed(2)} per day
                        </div>
                      </div>
                      <div className="text-right">
                        {allocation.pendingAmount > 0 && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            NPR {allocation.pendingAmount.toFixed(2)}
                          </Badge>
                        )}
                        {allocation.creditAmount > 0 && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            NPR {allocation.creditAmount.toFixed(2)}
                          </Badge>
                        )}
                        {allocation.pendingAmount === 0 && allocation.creditAmount === 0 && (
                          <Badge variant="outline">Paid Up</Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Calendar className="h-3 w-3" />
                          <span>Allocation Date</span>
                        </div>
                        <div className="font-medium">
                          {formatNepaliDateFromDate(new Date(allocation.allocationDate))}
                        </div>
                      </div>

                      {allocation.deallocationDate && (
                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Calendar className="h-3 w-3" />
                            <span>Deallocation Date</span>
                          </div>
                          <div className="font-medium">
                            {formatNepaliDateFromDate(new Date(allocation.deallocationDate))}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Calendar className="h-3 w-3" />
                          <span>Paid Until</span>
                        </div>
                        <div className="font-medium">
                          {formatNepaliDateFromDate(new Date(allocation.paidUntil))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Receipt className="h-3 w-3" />
                          <span>Total Days</span>
                        </div>
                        <div className="font-medium">
                          {allocation.totalPayableDays} days
                        </div>
                      </div>
                    </div>

                    {allocation.pendingDays > 0 && (
                      <div className="mt-3 p-2 bg-destructive/10 rounded-md text-sm">
                        <span className="text-destructive font-medium">
                          {allocation.pendingDays} day{allocation.pendingDays !== 1 ? 's' : ''} pending
                        </span>
                        <span className="text-muted-foreground"> - Payment overdue</span>
                      </div>
                    )}

                    {allocation.overpaidDays > 0 && (
                      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md text-sm">
                        <span className="text-blue-600 font-medium">
                          {allocation.overpaidDays} day{allocation.overpaidDays !== 1 ? 's' : ''} credit
                        </span>
                        <span className="text-muted-foreground"> - Paid in advance</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Summary Note */}
        {finalBalance !== 0 && (
          <>
            <Separator />
            <div className={`p-4 rounded-md ${
              finalBalance > 0 
                ? 'bg-destructive/10 border border-destructive/20' 
                : 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900'
            }`}>
              <p className="text-sm">
                {finalBalance > 0 ? (
                  <>
                    <span className="font-semibold text-destructive">Action Required:</span>
                    {' '}Student owes NPR {finalBalance.toFixed(2)}. Please collect payment to clear pending fees.
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-green-600">Credit Balance:</span>
                    {' '}Student has NPR {Math.abs(finalBalance).toFixed(2)} in credits from overpayments.
                  </>
                )}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useSession } from 'next-auth/react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/features/core/components/sheet'
import { Button } from '@/features/core/components/button'
import { Input } from '@/features/core/components/input'
import { Textarea } from '@/features/core/components/textarea'
import { Label } from '@/features/core/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/core/components/select'
import { NepaliDatePicker } from '@/features/core/components/nepali-date-picker'
import { toast } from 'sonner'
import axios from 'axios'
import { Loader2, AlertCircle, CreditCard } from 'lucide-react'
import { calculateTotalPayableDays } from '../../lib/calculations'
import { formatNepaliDateFromDate } from '@/features/core/lib/nepali-date'
import { ScrollArea } from '@/features/core/components/scroll-area'
import AllocationSelectorOptimized from '../../components/AllocationSelectorOptimized'

const paymentSchema = z.object({
  allocationId: z.string().min(1, 'Please select an allocation'),
  amount: z.string().min(1, 'Amount is required').refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Amount must be greater than 0',
  }),
  paymentDate: z.date({ message: 'Payment date is required' }),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE', 'CARD'], {
    message: 'Payment method is required',
  }),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
})

type PaymentFormValues = z.infer<typeof paymentSchema>

// Convert Date to YYYY-MM-DD format to avoid timezone issues
const convertDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface Allocation {
  id: string
  isActive: boolean
  deallocationDate?: Date | null
  student: {
    id: string
    fullname: string
    email: string
  }
  bed: {
    id: string
    bedNumber: string
    pricePerDay: number
    room: {
      id: string
      roomNumber: string
    }
  }
  allocationDate: Date
  paidUntil: Date
  payments?: Array<{ amount: number }>
}

interface AddHostelPaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddHostelPaymentDialog({
  isOpen,
  onClose,
  onSuccess,
}: AddHostelPaymentDialogProps) {
  const { data: session } = useSession()
  const userRole = session?.user?.role
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  
  const [isLoading, setIsLoading] = useState(false)
  const [allocations, setAllocations] = useState<Allocation[]>([])

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      allocationId: '',
      amount: '',
      paymentDate: new Date(),
      paymentMethod: 'CASH',
      referenceNumber: '',
      notes: '',
    },
  })

  const selectedAllocationId = form.watch('allocationId')
  const amount = form.watch('amount')

  const selectedAllocation = allocations.find((a) => a.id === selectedAllocationId)

  // Calculate days purchased
  const daysPurchased = selectedAllocation && amount
    ? Math.floor(parseFloat(amount) / selectedAllocation.bed.pricePerDay)
    : 0

  // Calculate current billing status
  const billingStatus = useMemo(() => {
    if (!selectedAllocation) return null

    const currentDate = !selectedAllocation.isActive && selectedAllocation.deallocationDate
      ? new Date(selectedAllocation.deallocationDate)
      : new Date()
    const allocationDate = new Date(selectedAllocation.allocationDate)
    const pricePerDay = selectedAllocation.bed.pricePerDay
    
    // Calculate total paid so far
    const totalPaid = (selectedAllocation.payments || []).reduce(
      (sum, payment) => sum + payment.amount,
      0
    )

    // Calculate days consumed
    const daysConsumed = calculateTotalPayableDays(allocationDate, currentDate)
    const amountConsumed = daysConsumed * pricePerDay

    // Calculate pending or overpaid
    const balance = totalPaid - amountConsumed
    const isPending = balance < 0
    const isOverpaid = balance > 0

    // Calculate what happens after this payment
    const newAmount = amount ? parseFloat(amount) : 0
    const newTotalPaid = totalPaid + newAmount
    const newBalance = newTotalPaid - amountConsumed
    const newOverpaid = newBalance > 0 ? newBalance : 0

    return {
      daysConsumed,
      amountConsumed,
      totalPaid,
      balance: Math.abs(balance),
      isPending,
      isOverpaid,
      newTotalPaid,
      newBalance,
      newOverpaid,
    }
  }, [selectedAllocation, amount])

  // Fetch active allocations
  useEffect(() => {
    const fetchAllocations = async () => {
      if (!isOpen) return

      try {
        const response = await axios.get('/api/hostel/allocations/active?includeInactive=true&limit=1000')
        setAllocations(response.data.allocations || response.data)
      } catch (error) {
        console.error('Error fetching allocations:', error)
        toast.error('Failed to load allocations')
      }
    }

    fetchAllocations()
  }, [isOpen])

  const onSubmit = async (data: PaymentFormValues) => {
    setIsLoading(true)
    try {
      // Convert date to YYYY-MM-DD format to avoid timezone issues
      const paymentDateStr = convertDateToYYYYMMDD(data.paymentDate)
      const paymentDate = new Date(paymentDateStr)

      await axios.post('/api/hostel/payments', {
        allocationId: data.allocationId,
        amount: parseFloat(data.amount),
        paymentDate: paymentDate.toISOString(),
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber || undefined,
        notes: data.notes || undefined,
        createdBy: 'admin', // TODO: Get from auth context
      })

      toast.success('Payment recorded successfully')
      form.reset()
      onClose()
      onSuccess()
    } catch (error: unknown) {
      console.error('Error creating payment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to record payment'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-2xl gap-0 pb-2 p-0 h-full font-medium overflow-hidden flex flex-col">
        <SheetHeader className="mb-2 p-4 border-b gap-0.5">
          <SheetTitle className="text-base">Add Hostel Payment</SheetTitle>
          <SheetDescription className="text-xs font-normal">
            Record a new payment for a student&apos;s hostel allocation
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 pb-4">
          {/* Allocation Selection */}
          <div className='flex flex-col gap-1.5'>
            <Label className="text-xs font-medium">
              Student Allocation <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="allocationId"
              control={form.control}
              render={({ field }) => (
                <AllocationSelectorOptimized
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoading}
                  placeholder="Select student allocation"
                  includeInactive
                />
              )}
            />
            {form.formState.errors.allocationId && (
              <p className="text-destructive text-xs">
                {form.formState.errors.allocationId.message}
              </p>
            )}
          </div>

          {/* Selected Allocation Info */}
          {selectedAllocation && billingStatus && (
            <div className="space-y-2">
              <div className="p-3 border rounded-md bg-muted/30">
                <h4 className="font-medium mb-1.5 text-xs">Allocation Details</h4>
                <div className="space-y-0.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Student:</span>
                    <span className="font-medium">{selectedAllocation.student.fullname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room:</span>
                    <span className="font-medium">{selectedAllocation.bed.room.roomNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bed:</span>
                    <span className="font-medium">{selectedAllocation.bed.bedNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price per day:</span>
                    <span className="font-medium">NPR {selectedAllocation.bed.pricePerDay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid until:</span>
                    <span className="font-medium">
                      {formatNepaliDateFromDate(new Date(selectedAllocation.paidUntil))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Billing Status */}
              {isAdmin ? (
                <div className={`p-3 border rounded-md ${
                  billingStatus.isPending 
                    ? 'bg-destructive/10 border-destructive/20' 
                    : billingStatus.isOverpaid 
                    ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                    : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                }`}>
                  <h4 className="font-medium mb-1.5 text-xs flex items-center gap-2">
                    {billingStatus.isPending && (
                      <>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span className="text-destructive">Pending Payment</span>
                      </>
                    )}
                    {billingStatus.isOverpaid && (
                      <>
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-600">Overpaid (Credit)</span>
                      </>
                    )}
                    {!billingStatus.isPending && !billingStatus.isOverpaid && (
                      <span className="text-green-600">Up to Date</span>
                    )}
                  </h4>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Days consumed:</span>
                      <span className="font-medium">{billingStatus.daysConsumed}d</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount consumed:</span>
                      <span className="font-medium">NPR {billingStatus.amountConsumed.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total paid:</span>
                      <span className="font-medium">NPR {billingStatus.totalPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-0.5 mt-0.5">
                      <span className="text-muted-foreground font-medium">
                        {billingStatus.isPending ? 'Pending:' : 'Overpaid:'}
                      </span>
                      <span className={`font-bold ${
                        billingStatus.isPending ? 'text-destructive' : 'text-blue-600'
                      }`}>
                        NPR {billingStatus.balance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 border rounded-md bg-muted/30">
                  <h4 className="font-medium mb-1.5 text-xs">Payment Status</h4>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total paid:</span>
                      <span className="font-medium">NPR {billingStatus.totalPaid.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* After Payment Preview */}
              {amount && parseFloat(amount) > 0 && (
                isAdmin ? (
                  <div className={`p-3 border rounded-md ${
                    billingStatus.newOverpaid > 0
                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                      : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                  }`}>
                    <h4 className="font-medium mb-1.5 text-xs flex items-center gap-2">
                      {billingStatus.newOverpaid > 0 ? (
                        <>
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-600">After Payment (Will be Overpaid)</span>
                        </>
                      ) : (
                        <span className="text-green-600">After Payment</span>
                      )}
                    </h4>
                    <div className="space-y-0.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">New total paid:</span>
                        <span className="font-medium">NPR {billingStatus.newTotalPaid.toFixed(2)}</span>
                      </div>
                      {billingStatus.newOverpaid > 0 && (
                        <div className="flex justify-between border-t pt-0.5 mt-0.5">
                          <span className="text-muted-foreground font-medium">Overpaid:</span>
                          <span className="font-bold text-blue-600">
                            NPR {billingStatus.newOverpaid.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {billingStatus.newOverpaid === 0 && billingStatus.newBalance === 0 && (
                        <div className="flex justify-between border-t pt-0.5 mt-0.5">
                          <span className="text-green-600 font-medium">Fully paid</span>
                        </div>
                      )}
                      {billingStatus.newBalance < 0 && (
                        <div className="flex justify-between border-t pt-0.5 mt-0.5">
                          <span className="text-muted-foreground font-medium">Still pending:</span>
                          <span className="font-bold text-destructive">
                            NPR {Math.abs(billingStatus.newBalance).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border rounded-md bg-muted/30">
                    <h4 className="font-medium mb-1.5 text-xs">After Payment</h4>
                    <div className="space-y-0.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">New total paid:</span>
                        <span className="font-medium">NPR {billingStatus.newTotalPaid.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Amount */}
          <div className='flex flex-col gap-1.5'>
            <Label className="text-xs font-medium">
              Amount <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Enter payment amount"
              {...form.register('amount')}
              disabled={isLoading}
              className="h-8 text-xs"
            />
            {form.formState.errors.amount && (
              <p className="text-destructive text-xs">{form.formState.errors.amount.message}</p>
            )}
            {daysPurchased > 0 && (
              <p className="text-xs text-muted-foreground">
                Covers {daysPurchased}d
              </p>
            )}
          </div>

          {/* Payment Date */}
          <div className='flex flex-col gap-1.5'>
            <Label className="text-xs font-medium">
              Payment Date <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="paymentDate"
              control={form.control}
              render={({ field }) => (
                <NepaliDatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select payment date"
                  mode="single"
                  className='w-full'
                />
              )}
            />
            {form.formState.errors.paymentDate && (
              <p className="text-destructive text-xs">
                {form.formState.errors.paymentDate.message}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className='flex flex-col gap-1.5'>
            <Label className="text-xs font-medium">
              Payment Method <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="paymentMethod"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="ONLINE">Online Payment</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.paymentMethod && (
              <p className="text-destructive text-xs">
                {form.formState.errors.paymentMethod.message}
              </p>
            )}
          </div>

          {/* Reference Number */}
          <div className='flex flex-col gap-1.5'>
            <Label className="text-xs font-medium">Reference Number (Optional)</Label>
            <Input
              placeholder="Enter reference number"
              {...form.register('referenceNumber')}
              disabled={isLoading}
              className="h-8 text-xs"
            />
          </div>

          {/* Notes */}
          <div className='flex flex-col gap-1.5'>
            <Label className="text-xs font-medium">Notes (Optional)</Label>
            <Textarea
              placeholder="Enter any additional notes..."
              {...form.register('notes')}
              className="resize-none h-16 text-xs"
              disabled={isLoading}
            />
          </div>

          </form>
        </ScrollArea>

        {/* Footer Buttons */}
        <div className="flex justify-between gap-4 p-4 border-t bg-background">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading} size="sm" className="h-8 text-xs">
            Cancel
          </Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={isLoading} size="sm" className="h-8 text-xs">
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Recording...
              </>
            ) : (
              'Record Payment'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

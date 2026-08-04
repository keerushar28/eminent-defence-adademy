'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/features/core/components/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/features/core/components/form'
import { Input } from '@/features/core/components/input'
import { Button } from '@/features/core/components/button'
import { toast } from 'sonner'
import { hostelApi } from '../api/hostel-api'

const bedSchema = z.object({
  bedNumber: z.string().min(1, 'Bed number is required'),
  pricePerMonth: z.string().min(1, 'Price per month is required'),
})

type BedFormValues = z.infer<typeof bedSchema>

interface AddBedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roomId: string
  roomNumber: string
  onSuccess: () => void
}

export function AddBedDialog({
  open,
  onOpenChange,
  roomId,
  roomNumber,
  onSuccess,
}: AddBedDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<BedFormValues>({
    resolver: zodResolver(bedSchema),
    defaultValues: {
      bedNumber: '',
      pricePerMonth: '',
    },
  })

  const onSubmit = async (data: BedFormValues) => {
    setIsLoading(true)
    try {
      const pricePerMonth = parseFloat(data.pricePerMonth)
      const pricePerDay = pricePerMonth / 30
      await hostelApi.beds.create({
        roomId,
        bedNumber: data.bedNumber,
        pricePerDay,
      })
      toast.success('Bed added successfully')
      form.reset()
      onOpenChange(false)
      onSuccess()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add bed'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Bed to Room {roomNumber}</DialogTitle>
          <DialogDescription>
            Add a new bed to this room with its price per month.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bedNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bed Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., A1, B2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricePerMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price Per Month</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 120000"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Monthly rental price for this bed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Bed'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

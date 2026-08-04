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
  DialogTrigger,
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
import { DropdownMenuItem } from '@/features/core/components/dropdown-menu'
import { toast } from 'sonner'
import { hostelApi } from '../api/hostel-api'
import { Bed } from '../../types/hostel.types'

const bedSchema = z.object({
  bedNumber: z.string().min(1, 'Bed number is required'),
  pricePerDay: z.string().min(1, 'Price per day is required'),
})

type BedFormValues = z.infer<typeof bedSchema>

interface EditBedProps {
  bed: Bed
  onUpdate: () => void
}

export default function EditBed({ bed, onUpdate }: EditBedProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<BedFormValues>({
    resolver: zodResolver(bedSchema),
    defaultValues: {
      bedNumber: bed.bedNumber,
      pricePerDay: bed.pricePerDay.toString(),
    },
  })

  const onSubmit = async (data: BedFormValues) => {
    setIsLoading(true)
    try {
      await hostelApi.beds.update(bed.id, {
        bedNumber: data.bedNumber,
        pricePerDay: parseFloat(data.pricePerDay),
      })
      toast.success('Bed updated successfully')
      setOpen(false)
      onUpdate()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update bed'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            setOpen(true)
          }}
        >
          Edit Bed
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Bed {bed.bedNumber}</DialogTitle>
          <DialogDescription>
            Update bed details including price per day.
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
              name="pricePerDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price Per Day</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 4000"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Daily rental price for this bed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Bed'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

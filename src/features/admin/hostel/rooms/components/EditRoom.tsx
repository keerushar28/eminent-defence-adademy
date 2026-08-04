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
import { Textarea } from '@/features/core/components/textarea'
import { Button } from '@/features/core/components/button'
import { DropdownMenuItem } from '@/features/core/components/dropdown-menu'
import { toast } from 'sonner'
import { hostelApi } from '../api/hostel-api'
import { Room } from '../../types/hostel.types'

const roomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required'),
  capacity: z.string().min(1, 'Capacity is required'),
  description: z.string().optional(),
})

type RoomFormValues = z.infer<typeof roomSchema>

interface EditRoomProps {
  room: Room
  onUpdate: () => void
}

export default function EditRoom({ room, onUpdate }: EditRoomProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const beds = room.beds || []
  const currentBedCount = beds.length

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      roomNumber: room.roomNumber,
      capacity: room.capacity.toString(),
      description: room.description || '',
    },
  })

  const onSubmit = async (data: RoomFormValues) => {
    const newCapacity = parseInt(data.capacity)
    
    // Validate capacity is not less than current bed count
    if (newCapacity < currentBedCount) {
      toast.error(`Cannot reduce capacity below ${currentBedCount}. Remove beds first.`)
      return
    }

    setIsLoading(true)
    try {
      await hostelApi.rooms.update(room.id, {
        roomNumber: data.roomNumber,
        capacity: newCapacity,
        description: data.description,
      })
      toast.success('Room updated successfully')
      setOpen(false)
      onUpdate()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update room'
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
          Edit Room
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Room {room.roomNumber}</DialogTitle>
          <DialogDescription>
            Update room details. Capacity cannot be less than current bed count ({currentBedCount}).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="roomNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 101, A-201" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 4" {...field} />
                  </FormControl>
                  <FormDescription>
                    Maximum number of beds (current: {currentBedCount})
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Single room with attached bathroom"
                      {...field}
                    />
                  </FormControl>
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
                {isLoading ? 'Updating...' : 'Update Room'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { Button } from "@/features/core/components/button"
import { Loader2, Plus, Save } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/features/core/components/sheet"
import { Input } from "@/features/core/components/input"
import { Textarea } from "@/features/core/components/textarea"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createRoom, updateRoom } from "../actions/room-actions"
import { Room } from "../types/hostel.types"

const roomFormSchema = z.object({
  roomNumber: z.string()
    .min(1, "Room number is required")
    .max(50, "Room number must not exceed 50 characters")
    .refine((val) => val.trim().length >= 1, "Room number cannot be just spaces"),

  capacity: z.coerce.number()
    .int("Capacity must be a whole number")
    .min(1, "Capacity must be at least 1")
    .max(100, "Capacity must not exceed 100"),

 
  description: z.string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
})

type RoomFormData = {
  roomNumber: string
  capacity: number
  description?: string | undefined
}

interface RoomFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  room?: Room | null
}

export default function RoomForm({ isOpen, onClose, onSuccess, room }: RoomFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditMode = !!room

  const form = useForm<RoomFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(roomFormSchema) as any,
    defaultValues: {
      roomNumber: "",
      capacity: 1,
      description: "",
    },
  })

  // Update form when room changes
  useEffect(() => {
    if (room) {
      form.reset({
        roomNumber: room.roomNumber,
        capacity: room.capacity,
        description: room.description || "",
      })
    } else {
      form.reset({
        roomNumber: "",
        capacity: 1,
        description: "",
      })
    }
  }, [room, form])

  const handleSubmit = async (values: RoomFormData) => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      if (isEditMode && room) {
        // Update existing room
        await updateRoom(room.id, {
          roomNumber: values.roomNumber,
          capacity: values.capacity,
          description: values.description || undefined,
        })

        toast.success("Room Updated Successfully! 🎉", {
          description: `Room "${values.roomNumber}" has been updated.`,
          duration: 5000,
        })
      } else {
        // Create new room
        await createRoom({
          roomNumber: values.roomNumber,
          capacity: values.capacity,
          description: values.description || undefined,
        })

        toast.success("Room Created Successfully! 🎉", {
          description: `Room "${values.roomNumber}" has been added.`,
          duration: 5000,
        })
      }

      form.reset()
      onSuccess()
    } catch (error) {
      console.error("Submission error:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      
      toast.error(isEditMode ? "Failed to Update Room ❌" : "Failed to Create Room ❌", {
        description: errorMessage,
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    form.reset()
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md gap-0 pb-2 p-6 h-full font-medium overflow-y-auto">
        <SheetHeader className="mb-2 p-0 border-b pb-4 gap-0.5">
          <SheetTitle className="text-xl">
            {isEditMode ? "Edit Room" : "Add Room"}
          </SheetTitle>
          <SheetDescription className="text-sm font-normal">
            {isEditMode 
              ? "Update the room details below." 
              : "Create a new hostel room. All fields marked with * are required."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium block mb-2">
              Room Number <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter room number (e.g., 101, A-12)..."
              {...form.register("roomNumber")}
              disabled={isSubmitting}
            />
            {form.formState.errors.roomNumber && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.roomNumber.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Capacity <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              placeholder="Enter room capacity..."
              {...form.register("capacity")}
              disabled={isSubmitting}
              min={1}
              max={100}
            />
            {form.formState.errors.capacity && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.capacity.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Maximum number of beds this room can accommodate
            </p>
          </div>



          <div>
            <label className="text-sm font-medium block mb-2">
              Description
            </label>
            <Textarea
              placeholder="Enter room description (optional)..."
              {...form.register("description")}
              className="resize-none text-sm min-h-20"
              disabled={isSubmitting}
            />
            {form.formState.errors.description && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  {isEditMode ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Room
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Room
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

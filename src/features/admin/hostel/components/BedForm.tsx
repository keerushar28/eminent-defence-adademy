'use client'

import { Button } from "@/features/core/components/button"
import { Loader2, Plus, Save } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/features/core/components/sheet"
import { Input } from "@/features/core/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/core/components/select"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createBed, updateBed } from "../actions/bed-actions"
import { Bed, Room, BedStatus } from "../types/hostel.types"

const bedFormSchema = z.object({
  roomId: z.string()
    .min(1, "Room selection is required"),

  bedNumber: z.string()
    .min(1, "Bed number is required")
    .max(50, "Bed number must not exceed 50 characters")
    .refine((val) => val.trim().length >= 1, "Bed number cannot be just spaces"),

  pricePerDay: z.coerce.number()
    .min(0.01, "Price per day must be greater than 0")
    .max(999999.99, "Price per day is too large")
    .optional(),

  status: z.nativeEnum(BedStatus).optional(),
})

type BedFormData = {
  roomId: string
  bedNumber: string
  pricePerDay?: number | undefined
  status?: BedStatus | undefined
}

interface BedFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  bed?: Bed | null
  rooms: Room[]
}

export default function BedForm({ isOpen, onClose, onSuccess, bed, rooms }: BedFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditMode = !!bed

  const form = useForm<BedFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(bedFormSchema) as any,
    defaultValues: {
      roomId: "",
      bedNumber: "",
      pricePerDay: undefined,
      status: BedStatus.AVAILABLE,
    },
  })

  // Update form when bed changes
  useEffect(() => {
    if (bed) {
      form.reset({
        roomId: bed.roomId,
        bedNumber: bed.bedNumber,
        pricePerDay: bed.pricePerDay,
        status: bed.status,
      })
    } else {
      form.reset({
        roomId: "",
        bedNumber: "",
        pricePerDay: undefined,
        status: BedStatus.AVAILABLE,
      })
    }
  }, [bed, form])

  const handleSubmit = async (values: BedFormData) => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      if (isEditMode && bed) {
        // Update existing bed
        await updateBed(bed.id, {
          bedNumber: values.bedNumber,
          pricePerDay: values.pricePerDay,
          status: values.status,
        })

        toast.success("Bed Updated Successfully! 🎉", {
          description: `Bed "${values.bedNumber}" has been updated.`,
          duration: 5000,
        })
      } else {
        // Create new bed
        await createBed({
          roomId: values.roomId,
          bedNumber: values.bedNumber,
          pricePerDay: values.pricePerDay || 0,
        })

        toast.success("Bed Created Successfully! 🎉", {
          description: `Bed "${values.bedNumber}" has been added.`,
          duration: 5000,
        })
      }

      form.reset()
      onSuccess()
    } catch (error) {
      console.error("Submission error:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"

      toast.error(isEditMode ? "Failed to Update Bed ❌" : "Failed to Create Bed ❌", {
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
            {isEditMode ? "Edit Bed" : "Add Bed"}
          </SheetTitle>
          <SheetDescription className="text-sm font-normal">
            {isEditMode
              ? "Update the bed details below."
              : "Create a new hostel bed. All fields marked with * are required."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium block mb-2">
              Room <span className="text-red-500">*</span>
            </label>
            <Controller
              name="roomId"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting || isEditMode}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a room..." />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.length === 0 ? (
                      <SelectItem value="no-rooms" disabled>
                        No rooms available
                      </SelectItem>
                    ) : (
                      rooms
                        .filter(room => room.isActive)
                        .map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            Room {room.roomNumber} (Capacity: {room.capacity})
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.roomId && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.roomId.message}</p>
            )}
            {isEditMode && (
              <p className="text-xs text-muted-foreground mt-1">
                Room cannot be changed after bed creation
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Bed Number <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter bed number (e.g., 1, A, B1)..."
              {...form.register("bedNumber")}
              disabled={isSubmitting}
            />
            {form.formState.errors.bedNumber && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.bedNumber.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Price Per Day (NPR ) <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder="Enter price per day..."
              {...form.register("pricePerDay")}
              disabled={isSubmitting}
              min={0.01}
            />
            {form.formState.errors.pricePerDay && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.pricePerDay.message}</p>
            )}
          </div>

          {isEditMode && (
            <div>
              <label className="text-sm font-medium block mb-2">
                Status
              </label>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={BedStatus.AVAILABLE}>Available</SelectItem>
                      <SelectItem value={BedStatus.INACTIVE}>Inactive</SelectItem>
                      <SelectItem value={BedStatus.ALLOCATED} disabled>
                        Allocated (Cannot be set manually)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {`Status is automatically set to "Allocated" when a student is assigned`}
              </p>
            </div>
          )}

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
                      Update Bed
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Bed
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

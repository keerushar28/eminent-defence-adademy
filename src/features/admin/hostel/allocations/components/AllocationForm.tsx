'use client'

import { Button } from "@/features/core/components/button"
import { Loader2, Plus } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/features/core/components/sheet"
import { Input } from "@/features/core/components/input"
import { Textarea } from "@/features/core/components/textarea"
import { Label } from "@/features/core/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/core/components/select"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { allocateStudent } from "../../actions/allocation-actions"
import { Room } from "../../types/hostel.types"
import StudentSelectorOptimized from "@/features/admin/components/StudentSelectorOptimized"
import RoomBedSelector from "../../rooms/components/RoomBedSelector"
import { IStudent } from "@/features/admin/students/types/types"
import axios from "axios"
import { ScrollArea } from "@/features/core/components/scroll-area"
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date"
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker"

const allocationFormSchema = z.object({
  studentId: z.string().min(1, "Student selection is required"),
  roomId: z.string().min(1, "Room selection is required"),
  bedId: z.string().min(1, "Bed selection is required"),
  allocationDate: z.date({ message: "Allocation date is required" }),
  initialPayment: z.string().optional(),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "ONLINE", "CARD"]).optional(),
  notes: z.string().max(500, "Notes must not exceed 500 characters").optional(),
})

type AllocationFormData = z.infer<typeof allocationFormSchema>

interface AllocationFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  rooms: Room[]
}

// Convert Date to YYYY-MM-DD format to avoid timezone issues
const convertDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AllocationForm({ isOpen, onClose, onSuccess, rooms }: AllocationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [students, setStudents] = useState<IStudent[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  const form = useForm<AllocationFormData>({
    resolver: zodResolver(allocationFormSchema),
    defaultValues: {
      studentId: "",
      roomId: "",
      bedId: "",
      allocationDate: new Date(),
      initialPayment: "",
      paymentMethod: "CASH",
      notes: "",
    },
  })

  const selectedStudentId = form.watch("studentId")
  const selectedRoomId = form.watch("roomId")
  const selectedBedId = form.watch("bedId")
  const allocationDate = form.watch("allocationDate")
  const initialPayment = form.watch("initialPayment")

  // Fetch all students on mount
  useEffect(() => {
    const fetchStudents = async () => {
      if (!isOpen) return

      setLoadingStudents(true)
      try {
        const response = await axios.get('/api/students')
        setStudents(response.data.students || [])
      } catch (error) {
        console.error("Error fetching students:", error)
        toast.error("Failed to load students")
        setStudents([])
      } finally {
        setLoadingStudents(false)
      }
    }

    fetchStudents()
  }, [isOpen])

  const handleSubmit = async (values: AllocationFormData) => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      const initialPayment = values.initialPayment ? parseFloat(values.initialPayment) : 0

      // Convert dates to YYYY-MM-DD format to avoid timezone issues
      const allocationDateStr = convertDateToYYYYMMDD(values.allocationDate)
      const allocationDate = new Date(allocationDateStr)

      // Set paidUntil to allocation date (will be updated if payment is made)
      const paidUntil = new Date(allocationDateStr)

      await allocateStudent({
        studentId: values.studentId,
        bedId: values.bedId,
        allocationDate: allocationDate,
        paidUntil: paidUntil,
        notes: values.notes || undefined,
        initialPayment: initialPayment > 0 ? initialPayment : undefined,
        paymentMethod: values.paymentMethod,
        createdBy: 'admin', // TODO: Get from auth context
      })

      const selectedStudent = students.find(s => s.id === values.studentId)
      toast.success("Student Allocated Successfully! 🎉", {
        description: `${selectedStudent?.fullname || 'Student'} has been allocated to the bed${initialPayment > 0 ? ' with initial payment recorded' : ''}.`,
        duration: 5000,
      })

      form.reset()
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Submission error:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"

      toast.error("Failed to Allocate Student ❌", {
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

  const selectedStudent = students.find(s => s.id === selectedStudentId)
  const selectedRoom = rooms.find(r => r.id === selectedRoomId)

  return (
    <Sheet open={isOpen} onOpenChange={onClose} modal>
      <SheetContent className="w-full sm:max-w-3xl gap-0 pb-2 p-0 h-full font-medium overflow-hidden flex flex-col">
        <SheetHeader className="mb-3 p-6 border-b gap-1">
          <SheetTitle className="text-2xl">
            Allocate Student to Bed
          </SheetTitle>
          <SheetDescription className="text-base font-normal">
            Select student, room, bed and set allocation details
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pb-6">
            {/* Student Selection */}
            <div>
              <Label className="text-base font-medium mb-3 block">
                Select Student <span className="text-red-500">*</span>
              </Label>
              {loadingStudents ? (
                <div className="flex items-center justify-center py-8 border rounded-md">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                  <span className="text-sm text-muted-foreground">Loading students...</span>
                </div>
              ) : (
                <Controller
                  name="studentId"
                  control={form.control}
                  render={({ field }) => (
                    <StudentSelectorOptimized
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                      placeholder="Search and select student..."
                      showAvatar={true}
                      showEmail={true}
                      showPhone={true}
                    />
                  )}
                />
              )}
              {form.formState.errors.studentId && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.studentId.message}</p>
              )}
            </div>

            {/* Room and Bed Selection */}
            <div>
              <Controller
                name="roomId"
                control={form.control}
                render={({ field: roomField }) => (
                  <Controller
                    name="bedId"
                    control={form.control}
                    render={({ field: bedField }) => (
                      <RoomBedSelector
                        selectedRoomId={roomField.value}
                        selectedBedId={bedField.value}
                        onRoomChange={roomField.onChange}
                        onBedChange={bedField.onChange}
                        rooms={rooms}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                )}
              />
              {form.formState.errors.roomId && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.roomId.message}</p>
              )}
              {form.formState.errors.bedId && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.bedId.message}</p>
              )}
            </div>

            {/* Allocation Date */}
            <div>
              <Label className="text-base font-medium mb-3 block">
                Allocation Date <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="allocationDate"
                control={form.control}
                render={({ field }) => (
                  <NepaliDatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select allocation date"
                    mode="single"
                    className="w-full"
                  />
                )}
              />
              {form.formState.errors.allocationDate && (
                <p className="text-red-500 text-sm mt-2">{form.formState.errors.allocationDate.message}</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                The date when the student starts occupying the bed
              </p>
            </div>

            {/* Initial Payment */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium mb-3 block">
                  Initial Payment <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter initial payment amount"
                  {...form.register("initialPayment")}
                  disabled={isSubmitting}
                />
                {form.formState.errors.initialPayment && (
                  <p className="text-red-500 text-sm mt-2">{form.formState.errors.initialPayment.message}</p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  Payment made at the time of allocation
                </p>
              </div>

              {/* Payment Method - Only show if initial payment is entered */}
              {initialPayment && parseFloat(initialPayment) > 0 && (
                <div>
                  <Label className="text-base font-medium mb-3 block">
                    Payment Method <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="paymentMethod"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                      >
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
                    <p className="text-red-500 text-sm mt-2">{form.formState.errors.paymentMethod.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label className="text-base font-medium mb-3 block">
                Notes <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Textarea
                placeholder="Enter any additional notes..."
                {...form.register("notes")}
                className="resize-none text-base min-h-24"
                disabled={isSubmitting}
              />
              {form.formState.errors.notes && (
                <p className="text-red-500 text-sm mt-2">{form.formState.errors.notes.message}</p>
              )}
            </div>

            {/* Summary */}
            {selectedStudent && selectedRoom && selectedBedId && (
              <div className="p-5 border rounded-md bg-muted/30">
                <h4 className="font-semibold mb-4 text-base">Allocation Summary</h4>
                <div className="space-y-3 text-base">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Student:</span>
                    <span className="font-medium">{selectedStudent.fullname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room:</span>
                    <span className="font-medium">{selectedRoom.roomNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allocation Date:</span>
                    <span className="font-medium">{formatNepaliDateFromDate(allocationDate)}</span>
                  </div>
                  {initialPayment && parseFloat(initialPayment) > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Initial Payment:</span>
                        <span className="font-medium">Rs {parseFloat(initialPayment).toFixed(2)}</span>
                      </div>
                      {form.watch("paymentMethod") && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Method:</span>
                          <span className="font-medium">{form.watch("paymentMethod")?.replace('_', ' ')}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </form>
        </ScrollArea>

        {/* Footer Buttons */}
        <div className="flex justify-between gap-4 p-6 border-t bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="h-11 text-base"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isSubmitting}
            className="h-11 text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Allocating...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Allocate Student
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

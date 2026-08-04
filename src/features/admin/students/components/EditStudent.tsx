'use client'

import { Button } from "@/features/core/components/button"
import { Edit, ImageIcon, Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/features/core/components/sheet"
import { Input } from "@/features/core/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/core/components/select"
import { Textarea } from "@/features/core/components/textarea"
import { Checkbox } from "@/features/core/components/checkbox"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { z } from "zod"
import ProfileImageUploader from "@/features/core/components/shared/profile-image-uploader"
import { getStudentById, updateStudent } from "../actions/student-actions"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { IStudent } from "../types/types"
import SelectImages from "@/features/core/components/shared/select-images"
import { Form } from "@/features/core/components/form"
import TagInput from "@/features/core/components/tag-input"
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker"
import { useCategoryAssignment } from "@/features/admin/students/hooks/useCategoryAssignment"
import { useExistingAssignments } from "@/features/admin/students/hooks/useExistingAssignments"
import { CategoryAssignmentList } from "./CategoryAssignmentList"
import { assignCategoriesToStudent, CategoryAssignment, removeStudentCategory } from "../actions/category-assignment-actions"

// Enhanced form schema with comprehensive validation
export const editStudentFormSchema = z.object({
    fullname: z.string()
        .min(2, "Full name must be at least 2 characters")
        .max(100, "Full name must not exceed 100 characters")
        .refine((val) => val.trim().length >= 2, "Full name cannot be just spaces"),

    email: z.string()
        .email("Please enter a valid email address")
        .min(5, "Email must be at least 5 characters")
        .max(100, "Email must not exceed 100 characters")
        .transform(val => val.toLowerCase()),

    gender: z.enum(["MALE", "FEMALE"], {
        message: "Please select a gender"
    }),

    dob: z.date({ message: "Date of birth is required" })
        .refine((date) => !isNaN(date.getTime()), "Please select a valid date of birth")
        .refine((date) => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
            const dobNormalized = new Date(date.getFullYear(), date.getMonth(), date.getDate())
            return dobNormalized <= today && dobNormalized >= minDate
        }, "Date of birth must be between 100 years ago and today"),

    blood_group: z.enum([
        "A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE",
        "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"
    ], {
        message: "Please select a blood group"
    }),

    contact_number_student: z.string()
        .min(10, "Student contact number must be at least 10 digits")
        .max(15, "Student contact number must not exceed 15 digits")
        .refine((val) => {
            const digitsOnly = val.replace(/[^0-9]/g, '')
            return digitsOnly.length >= 10 && digitsOnly.length <= 15
        }, "Contact number must contain 10-15 digits"),

    contact_number_parent: z.string()
        .min(10, "Parent contact number must be at least 10 digits")
        .max(15, "Parent contact number must not exceed 15 digits")
        .refine((val) => {
            const digitsOnly = val.replace(/[^0-9]/g, '')
            return digitsOnly.length >= 10 && digitsOnly.length <= 15
        }, "Contact number must contain 10-15 digits"),

    permanent_address: z.string()
        .min(5, "Permanent address must be at least 5 characters")
        .max(500, "Permanent address must not exceed 500 characters")
        .refine((val) => val.trim().length >= 5, "Permanent address cannot be just spaces"),

    temporary_address: z.string()
        .min(5, "Temporary address must be at least 5 characters")
        .max(500, "Temporary address must not exceed 500 characters")
        .refine((val) => val.trim().length >= 5, "Temporary address cannot be just spaces"),

    parentName: z.string()
        .min(2, "Parent name must be at least 2 characters")
        .max(100, "Parent name must not exceed 100 characters")
        .refine((val) => val.trim().length >= 2, "Parent name cannot be just spaces"),

    guardianName: z.string()
        .max(100, "Guardian name must not exceed 100 characters")
        .optional()
        .or(z.literal("")),

    citizenship_number: z.string()
        .min(1, "Citizenship number must be at least 1 characters")
        .max(50, "Citizenship number must not exceed 50 characters"),
    height: z.string()
        .min(1, "Height is required")
        .max(20, "Height must not exceed 20 characters")
        .refine((val) => {
            // Allow formats: 170, 5.8, 5'8, 5' 8, 5′8 (unicode prime)
            return /^(\d+(\.\d+)?|\d+\s*['′]\s*\d+)$/.test(val.trim())
        }, "Please enter a valid height (e.g., 170, 5.8, or 5'8)"),

    heightUnit: z.enum(["cm", "m", "ft", "inches"], {
        message: "Please select a valid height unit"
    }).default("cm"),

    weight: z.string()
        .min(1, "Weight is required")
        .max(20, "Weight must not exceed 20 characters")
        .refine((val) => /^\d+(\.\d+)?$/.test(val.trim()), "Please enter a valid weight number"),

    weightUnit: z.enum(["kg", "lb"], {
        message: "Please select a valid weight unit"
    }).default("kg"),

    dress: z.boolean().default(false),
    books: z.boolean().default(false),
    hostel: z.boolean().default(false),
    qualifications: z.array(z.string()).default([]),
    createdAt: z.date({ message: "Registration date is required" })
        .refine((date) => !isNaN(date.getTime()), "Please select a valid registration date"),
    image: (typeof window === 'undefined' ? z.any() : z.instanceof(File, { message: "Invalid image file" }))
        .refine((file) => file.size <= 5 * 1024 * 1024, "Image size must be less than 5MB")
        .refine(
            (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
            "Only .jpg, .jpeg, .png and .webp formats are supported"
        )
        .optional()
        .nullable(),
    removeImage: z.string().optional(),
    attachments: z
        .array(typeof window === 'undefined' ? z.any() : z.instanceof(File))
        .refine(
            (files) => files.every((file) => file.size <= 5 * 1024 * 1024),
            { message: "Each file must be under 5MB" }
        )
        .refine(
            (files) => {
                const allowedTypes = [
                    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-powerpoint',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                ];
                return files.every((file) => allowedTypes.includes(file.type));
            },
            { message: "Only images, PDFs, and Office documents are allowed" }
        )
})

type StudentFormData = z.infer<typeof editStudentFormSchema>

interface EditStudentProps {
    studentId: string
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function EditStudent({ studentId, isOpen, onClose, onSuccess }: EditStudentProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [student, setStudent] = useState<IStudent | null>(null)
    const [existingAttachments, setExistingAttachments] = useState<string[]>([])
    const [deletedAttachments, setDeletedAttachments] = useState<string[]>([])
    const [initialSubCategoryIds, setInitialSubCategoryIds] = useState<Set<string>>(new Set())
    const router = useRouter()

    // Category Assignment Hook
    const assignHook = useCategoryAssignment()
    const {
        setAssignments,
        validationResults,
        isFormValid: isCategoryFormValid,
        selectedSubCategoryIds,
        assignedDates,
        durations,
        notes,
        resetForm: resetCategoryForm
    } = assignHook

    // Existing Assignments Hook - always fetch from server for fresh data
    const {
        existingAssignments,
        alreadyAssignedSubCategoryIds
    } = useExistingAssignments({
        studentId: studentId
    })

    // Helper function to safely get error message
    const getErrorMessage = (error: any): string | undefined => {
        if (typeof error === 'string') return error
        if (error && typeof error === 'object' && 'message' in error) {
            return typeof error.message === 'string' ? error.message : undefined
        }
        return undefined
    }


    // Initialize form with react-hook-form
    const form = useForm({
        resolver: zodResolver(editStudentFormSchema),
        defaultValues: {
            fullname: "",
            email: "",
            gender: undefined as unknown as StudentFormData["gender"],
            dob: undefined as unknown as Date,
            blood_group: undefined as unknown as StudentFormData["blood_group"],
            contact_number_student: "",
            contact_number_parent: "",
            permanent_address: "",
            temporary_address: "",
            parentName: "",
            guardianName: "",
            citizenship_number: "",
            height: "",
            heightUnit: "cm",
            weight: "",
            weightUnit: "kg",
            dress: false,
            books: false,
            hostel: false,
            qualifications: [],
            createdAt: new Date(),
            image: undefined as StudentFormData["image"],
            attachments: []

        },
    })
    const attachmentCount = form.watch('attachments')?.length || 0;


    // Watch the image field for the ProfileImageUploader
    const selectedImage = form.watch("image")

    // Load student data when modal opens
    useEffect(() => {
        if (!isOpen || !studentId) return;

        const loadStudentData = async () => {
            setIsLoading(true)
            try {
                const studentData = await getStudentById(studentId)
                if (studentData) {
                    setStudent(studentData)
                    const dobDate = new Date(studentData.dob)

                    // Set existing attachments
                    setExistingAttachments(studentData.images || [])

                    const validHeightUnits = ["cm", "m", "ft", "inches"];
                    const validWeightUnits = ["kg", "lb"];
                    const heightUnit = studentData.heightUnit || "cm";
                    const weightUnit = studentData.weightUnit || "kg";

                    form.reset({
                        fullname: studentData.fullname,
                        email: studentData.email,
                        gender: studentData.gender,
                        dob: dobDate,
                        blood_group: studentData.blood_group,
                        contact_number_student: studentData.contact_number_student,
                        contact_number_parent: studentData.contact_number_parent,
                        permanent_address: studentData.permanent_address,
                        temporary_address: studentData.temporary_address,
                        parentName: studentData.parentName,
                        guardianName: studentData.guardianName || "",
                        citizenship_number: studentData.citizenship_number,
                        height: studentData.height || "",
                        heightUnit: (validHeightUnits.includes(heightUnit) ? heightUnit : "cm") as "cm" | "m" | "ft" | "inches",
                        weight: studentData.weight || "",
                        weightUnit: (validWeightUnits.includes(weightUnit) ? weightUnit : "kg") as "kg" | "lb",
                        dress: studentData.dress,
                        books: studentData.books,
                        hostel: studentData.hostel,
                        qualifications: Array.isArray(studentData.qualifications) ? studentData.qualifications : [],
                        createdAt: new Date(studentData.createdAt),
                        image: undefined,
                        attachments: [],
                    })

                    // Initialize category assignments
                    if (studentData.studentCategories) {
                        const activeAssignments = studentData.studentCategories.filter((sc: any) => sc.isActive)

                        // Track initial IDs for removal detection
                        setInitialSubCategoryIds(new Set(activeAssignments.map((sc: any) => sc.subCategoryId || sc.subCategory?.id)))

                        const formattedAssignments = activeAssignments.map((sc: any) => ({
                            subCategoryId: sc.subCategoryId || sc.subCategory?.id,
                            discountAmount: typeof sc.discountAmount === 'string' ? parseFloat(sc.discountAmount) : Number(sc.discountAmount || 0),
                            assignedDate: sc.assignedDate ? new Date(sc.assignedDate) : undefined,
                            durationMonths: sc.durationMonths ?? undefined,
                            notes: sc.notes || undefined
                        }))

                        setAssignments(formattedAssignments)
                    } else {
                        setAssignments([])
                        setInitialSubCategoryIds(new Set())
                    }
                } else {
                    toast.error("Student not found")
                    onClose()
                }
            } catch (error) {
                console.error("Error loading student:", error)
                toast.error("Failed to load student data")
                onClose()
            } finally {
                setIsLoading(false)
            }
        }

        loadStudentData()
    }, [isOpen, studentId, form, onClose])

    const handleSubmit = async (values: StudentFormData) => {
        if (isSubmitting) return

        setIsSubmitting(true)

        try {
            const submitData = new FormData()

            // Append all form fields
            Object.entries(values).forEach(([key, value]) => {
                if (key === 'dress' || key === 'books' || key === 'hostel') {
                    submitData.append(key, String(value))
                }
                else if (key === 'dob' || key === 'createdAt') {
                    // Convert Date to YYYY-MM-DD format to avoid timezone issues
                    if (value instanceof Date && !isNaN(value.getTime())) {
                        const year = value.getFullYear()
                        const month = String(value.getMonth() + 1).padStart(2, '0')
                        const day = String(value.getDate()).padStart(2, '0')
                        submitData.append(key, `${year}-${month}-${day}`)
                    } else {
                        console.error("Invalid date value:", value)
                        throw new Error(`Invalid ${key}`)
                    }
                }
                else if (key === 'image' && value instanceof File) {
                    submitData.append('student_image', value)
                } else if (key === 'removeImage' && value) {
                    submitData.append('removeImage', value)
                } else if (key === 'qualifications' && Array.isArray(value)) {
                    // Append qualifications as JSON
                    submitData.append(key, JSON.stringify(value))
                } else if (key === 'heightUnit' || key === 'weightUnit') {
                    submitData.append(key, String(value))
                } else if (key === 'attachments' && Array.isArray(value)) {
                    // Append each attachment file
                    (value as File[]).forEach((file: File) => {
                        if (file instanceof File) {
                            submitData.append('attachments', file)
                        }
                    })
                } else if (key !== 'image' && key !== 'removeImage' && key !== 'attachments' && key !== 'qualifications' && key !== 'dob' && key !== 'createdAt' && key !== 'heightUnit' && key !== 'weightUnit' && value != null) {
                    submitData.append(key, String(value))
                }
            })

            // Append deleted attachments for cleanup
            submitData.append('deletedAttachments', JSON.stringify(deletedAttachments))

            const result = await updateStudent(studentId, submitData)

            if (result.success) {

                // Handle Category Assignments
                if (selectedSubCategoryIds.length > 0 || initialSubCategoryIds.size > 0) {
                    if (!isCategoryFormValid) {
                        toast.warning("Student updated but categories were not saved due to validation errors.")
                    } else {
                        try {
                            // 1. Identify removals
                            const toRemove = Array.from(initialSubCategoryIds).filter(id => !selectedSubCategoryIds.includes(id))

                            // Find the studentCategoryId for each subCategoryId to remove
                            // We need to look it up from the loaded student data which we might need to store better or refetch
                            // For simplicity, let's assume we can remove by subCategoryId if we had an action for it, 
                            // but removeStudentCategory takes studentCategoryId (the relation ID).
                            // We need to map subCategoryId -> studentCategoryId from the loaded data.

                            if (toRemove.length > 0 && student?.studentCategories) {
                                for (const subId of toRemove) {
                                    const relation = student.studentCategories.find((sc: any) =>
                                        (sc.subCategoryId === subId || sc.subCategory?.id === subId) && sc.isActive
                                    )
                                    if (relation) {
                                        await removeStudentCategory(relation.id)
                                    }
                                }
                            }

                            // 2. Identify Adds/Updates
                            // We send ALL currently selected categories. 
                            // The action will create new ones or update existing ones (as we modified it to update).
                            const assignments: CategoryAssignment[] = validationResults.map(r => ({
                                subCategoryId: r.subCategoryId,
                                discountAmount: r.discount,
                                assignedDate: assignedDates[r.subCategoryId],
                                durationMonths: durations[r.subCategoryId] ? parseInt(durations[r.subCategoryId]) : undefined,
                                notes: notes[r.subCategoryId] || undefined
                            }))

                            if (assignments.length > 0) {
                                const assignResult = await assignCategoriesToStudent(studentId, assignments)
                                if (!assignResult.success) {
                                    toast.error("Student updated but failed to update categories: " + assignResult.error)
                                }
                            }

                        } catch (assignError) {
                            console.error("Error updating categories:", assignError)
                            toast.error("Error updating categories")
                        }
                    }
                }

                router.refresh()
                toast.success("Student Updated Successfully! 🎉", {
                    description: `Student "${values.fullname}" has been updated.`,
                    duration: 5000,
                })

                onClose()
                onSuccess()
            } else {
                toast.error("Failed to Update Student ❌", {
                    description: result.error || "Something went wrong. Please try again.",
                    duration: 5000,
                })
            }

        } catch (error) {
            console.error("Submission error:", error)
            toast.error("Submission Error ❌", {
                description: "An unexpected error occurred. Please try again.",
                duration: 5000,
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancel = () => {
        form.reset()
        resetCategoryForm()
        setExistingAttachments([])
        setDeletedAttachments([])
        onClose()
    }

    const handleRemoveExistingAttachment = (attachmentUrl: string) => {
        setExistingAttachments(prev => prev.filter(url => url !== attachmentUrl))
        setDeletedAttachments(prev => [...prev, attachmentUrl])
    }



    if (isLoading) {
        return (
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent className="w-full sm:max-w-xl gap-0 pb-2 p-6 md:max-w-2xl lg:max-w-3xl h-full font-medium overflow-y-auto">
                    <SheetHeader className="mb-2 p-0 border-b pb-4 gap-0.5">
                        <SheetTitle className="text-xl">Edit Student</SheetTitle>
                        <SheetDescription className="text-sm font-normal">
                            Loading student information...
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Loading student data...</span>
                    </div>
                </SheetContent>
            </Sheet>
        )
    }
    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-xl gap-0 pb-2 p-6 md:max-w-2xl lg:max-w-3xl h-full font-medium overflow-y-auto">
                <SheetHeader className="mb-2 p-0 border-b pb-4 gap-0.5">
                    <SheetTitle className="text-xl">Edit Student</SheetTitle>
                    <SheetDescription className="text-sm font-normal">
                        Update student information. All fields marked with * are required.
                    </SheetDescription>
                </SheetHeader>
                <Form {...form}>

                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
                        {/* Profile Image */}
                        <div className="flex flex-col space-y-4 border-b pb-6">
                            <h3 className="text-sm font-medium">Profile Image (Optional)</h3>
                            <ProfileImageUploader
                                form={form}
                                selectedImage={selectedImage || null}
                                disabled={isSubmitting}
                                existingImageUrl={student?.student_image}
                            />
                            {form.formState.errors.image && (
                                <p className="text-red-500 text-xs mt-1">{getErrorMessage(form.formState.errors.image)}</p>
                            )}
                        </div>

                        {/* Personal Information */}
                        <div className="flex flex-col space-y-4 border-b pb-6">
                            <h3 className="text-lg font-medium">Personal Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium block mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="Enter student's full name..."
                                        {...form.register("fullname")}
                                        disabled={isSubmitting}
                                    />
                                    {form.formState.errors.fullname && (
                                        <p className="text-red-500 text-xs mt-1">{getErrorMessage(form.formState.errors.fullname)}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium block mb-2">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="email"
                                        placeholder="Enter email address..."
                                        {...form.register("email")}
                                        disabled={isSubmitting}
                                    />
                                    {form.formState.errors.email && (
                                        <p className="text-red-500 text-xs mt-1">{getErrorMessage(form.formState.errors.email)}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium block mb-2">
                                        Gender <span className="text-red-500">*</span>
                                    </label>
                                    <Select
                                        value={form.watch("gender") || ""}
                                        onValueChange={(value) => form.setValue("gender", value as "MALE" | "FEMALE", { shouldValidate: true })}
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MALE">Male</SelectItem>
                                            <SelectItem value="FEMALE">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {form.formState.errors.gender && (
                                        <p className="text-red-500 text-xs mt-1">{getErrorMessage(form.formState.errors.gender)}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium block mb-2">
                                        Date of Birth <span className="text-red-500">*</span>
                                    </label>
                                    <NepaliDatePicker
                                        value={form.watch("dob")}
                                        onChange={(date) => form.setValue("dob", date as Date, { shouldValidate: true })}
                                        placeholder="Select date of birth"
                                        className="w-full"
                                    />
                                    {form.formState.errors.dob && (
                                        <p className="text-red-500 text-xs mt-1">{getErrorMessage(form.formState.errors.dob)}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium block mb-2">
                                        Blood Group <span className="text-red-500">*</span>
                                    </label>
                                    <Select
                                        value={form.watch("blood_group") || ""}
                                        onValueChange={(value) => form.setValue("blood_group", value as StudentFormData["blood_group"], { shouldValidate: true })}
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select blood group" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="A_POSITIVE">A+</SelectItem>
                                            <SelectItem value="A_NEGATIVE">A-</SelectItem>
                                            <SelectItem value="B_POSITIVE">B+</SelectItem>
                                            <SelectItem value="B_NEGATIVE">B-</SelectItem>
                                            <SelectItem value="AB_POSITIVE">AB+</SelectItem>
                                            <SelectItem value="AB_NEGATIVE">AB-</SelectItem>
                                            <SelectItem value="O_POSITIVE">O+</SelectItem>
                                            <SelectItem value="O_NEGATIVE">O-</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {form.formState.errors.blood_group && (
                                        <p className="text-red-500 text-xs mt-1">{getErrorMessage(form.formState.errors.blood_group)}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium block mb-2">
                                        Citizenship Number <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="Enter citizenship number..."
                                        {...form.register("citizenship_number")}
                                        disabled={isSubmitting}
                                    />
                                    {form.formState.errors.citizenship_number && (
                                        <p className="text-red-500 text-xs mt-1">{getErrorMessage(form.formState.errors.citizenship_number)}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium block mb-2">
                                        Height <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="e.g., 170 or 5'8"
                                            {...form.register("height")}
                                            disabled={isSubmitting}
                                            className="flex-1"
                                        />
                                        <Select
                                            value={form.watch("heightUnit") || "cm"}
                                            onValueChange={(value) => form.setValue("heightUnit", value as "cm" | "m" | "ft" | "inches", { shouldValidate: true })}
                                            disabled={isSubmitting}
                                        >
                                            <SelectTrigger className="w-24">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cm">cm</SelectItem>
                                                <SelectItem value="m">m</SelectItem>
                                                <SelectItem value="ft">ft</SelectItem>
                                                <SelectItem value="inches">in</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {form.formState.errors.height && (
                                        <p className="text-red-500 text-xs mt-1">{getErrorMessage(form.formState.errors.height)}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium block mb-2">
                                        Weight <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Enter weight"
                                            type="number"
                                            step="0.01"
                                            {...form.register("weight")}
                                            disabled={isSubmitting}
                                            className="flex-1"
                                        />
                                        <Select
                                            value={form.watch("weightUnit") || "kg"}
                                            onValueChange={(value) => form.setValue("weightUnit", value as "kg" | "lb", { shouldValidate: true })}
                                            disabled={isSubmitting}
                                        >
                                            <SelectTrigger className="w-20">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="kg">kg</SelectItem>
                                                <SelectItem value="lb">lb</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {form.formState.errors.weight && (
                                        <p className="text-red-500 text-xs mt-1">{getErrorMessage(form.formState.errors.weight)}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="flex flex-col space-y-4 border-b pb-6">
                            <h3 className="text-lg font-medium">Contact Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium block mb-2">
                                        Student&apos;s Phone <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="Enter student's phone number..."
                                        {...form.register("contact_number_student")}
                                        disabled={isSubmitting}
                                    />
                                    {form.formState.errors.contact_number_student && (
                                        <p className="text-red-500 text-xs mt-1">{getErrorMessage(form.formState.errors.contact_number_student)}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium block mb-2">
                                        Parent&apos;s Phone <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="Enter parent's phone number..."
                                        {...form.register("contact_number_parent")}
                                        disabled={isSubmitting}
                                    />
                                    {form.formState.errors.contact_number_parent && (
                                        <p className="text-red-500 text-xs mt-1">{getErrorMessage(form.formState.errors.contact_number_parent)}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Parent&apos;s Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    placeholder="Enter parent's full name..."
                                    {...form.register("parentName")}
                                    disabled={isSubmitting}
                                />
                                {form.formState.errors.parentName && (
                                    <p className="text-red-500 text-xs mt-1">{getErrorMessage(form.formState.errors.parentName)}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Guardian&apos;s Name
                                </label>
                                <Input
                                    placeholder="Enter guardian's full name (optional)..."
                                    {...form.register("guardianName")}
                                    disabled={isSubmitting}
                                />
                                {form.formState.errors.guardianName && (
                                    <p className="text-red-500 text-xs mt-1">{getErrorMessage(form.formState.errors.guardianName)}</p>
                                )}
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="flex flex-col space-y-4 border-b pb-6">
                            <h3 className="text-lg font-medium">Address Information</h3>

                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Permanent Address <span className="text-red-500">*</span>
                                </label>
                                <Textarea
                                    placeholder="Enter permanent address..."
                                    {...form.register("permanent_address")}
                                    className="resize-none text-sm min-h-20"
                                    disabled={isSubmitting}
                                />
                                {form.formState.errors.permanent_address && (
                                    <p className="text-red-500 text-xs mt-1">{getErrorMessage(form.formState.errors.permanent_address)}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Temporary Address <span className="text-red-500">*</span>
                                </label>
                                <Textarea
                                    placeholder="Enter temporary address..."
                                    {...form.register("temporary_address")}
                                    className="resize-none text-sm min-h-20"
                                    disabled={isSubmitting}
                                />
                                {form.formState.errors.temporary_address && (
                                    <p className="text-red-500 text-xs mt-1">{getErrorMessage(form.formState.errors.temporary_address)}</p>
                                )}
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="flex flex-col space-y-4 border-b pb-6">
                            <h3 className="text-lg font-medium">Additional Information</h3>

                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Registration Date <span className="text-red-500">*</span>
                                </label>
                                <NepaliDatePicker
                                    value={form.watch("createdAt")}
                                    onChange={(date) => form.setValue("createdAt", date as Date, { shouldValidate: true })}
                                    placeholder="Select registration date"
                                    className="w-full"
                                />
                                {form.formState.errors.createdAt && (
                                    <p className="text-red-500 text-xs mt-1">{getErrorMessage(form.formState.errors.createdAt)}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Qualifications
                                </label>
                                <TagInput
                                    value={form.watch("qualifications") || []}
                                    onChange={(tags) => form.setValue("qualifications", tags, { shouldValidate: true })}
                                    placeholder="Enter qualification and press Enter..."
                                    disabled={isSubmitting}
                                    maxLength={100}
                                    error={getErrorMessage(form.formState.errors.qualifications)}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="dress"
                                    checked={form.watch("dress")}
                                    onCheckedChange={(checked) => form.setValue("dress", checked as boolean, { shouldValidate: true, shouldDirty: true })}
                                    disabled={isSubmitting}
                                />
                                <label htmlFor="dress" className="text-sm font-medium">
                                    Dress Required
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="books"
                                    checked={form.watch("books")}
                                    onCheckedChange={(checked) => form.setValue("books", checked as boolean, { shouldValidate: true, shouldDirty: true })}
                                    disabled={isSubmitting}
                                />
                                <label htmlFor="books" className="text-sm font-medium">
                                    Books Required
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="hostel"
                                    checked={form.watch("hostel")}
                                    onCheckedChange={(checked) => form.setValue("hostel", checked as boolean, { shouldValidate: true, shouldDirty: true })}
                                    disabled={isSubmitting}
                                />
                                <label htmlFor="hostel" className="text-sm font-medium">
                                    Hostel Management
                                </label>
                            </div>
                        </div>


                        <div className="flex flex-col space-y-3 border-b pb-6">
                            <CategoryAssignmentList
                                assignHook={assignHook}
                                alreadyAssignedSubCategoryIds={alreadyAssignedSubCategoryIds}
                                isSubmitting={isSubmitting}
                                editMode
                            />
                        </div>

                        {/* Attachments Section - Add New Images */}
                        <div className="flex flex-col space-y-3">
                            <div className="flex items-center gap-2">
                                <ImageIcon size={16} />
                                <h3 className="font-medium">Add More Images</h3>
                                {attachmentCount > 0 && (
                                    <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                        {attachmentCount} file{attachmentCount !== 1 ? 's' : ''} selected
                                    </span>
                                )}
                            </div>
                            <SelectImages
                                mode="edit"
                                form={form}
                                selectedAttachments={form.watch('attachments') || []}
                                existingAttachments={existingAttachments}
                                onRemoveExisting={handleRemoveExistingAttachment}
                            />
                            <p className="text-sm text-muted-foreground">
                                Supported formats: Images (JPEG, PNG, WebP, GIF). Max 5MB per file.
                            </p>
                        </div>

                        {/* Action Buttons */}
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
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Update Student
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet >
    )

}
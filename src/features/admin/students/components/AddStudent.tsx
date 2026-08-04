
'use client'

import { Button } from "@/features/core/components/button"
import { Plus, Loader2, Paperclip } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/features/core/components/sheet"
import { Input } from "@/features/core/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/core/components/select"
import { Textarea } from "@/features/core/components/textarea"
import { Checkbox } from "@/features/core/components/checkbox"
import { toast } from "sonner"
import { useState } from "react"
import { z } from "zod"
import ProfileImageUploader from "@/features/core/components/shared/profile-image-uploader"
import { createStudent } from "../actions/student-actions"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import SelectImages from "@/features/core/components/shared/select-images"
import { Form } from "@/features/core/components/form"
import TagInput from "@/features/core/components/tag-input"
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker"
import { useCategoryAssignment, AssignmentData } from "@/features/admin/students/hooks/useCategoryAssignment"
import { CategoryAssignmentList } from "./CategoryAssignmentList"
import { assignCategoriesToStudent, CategoryAssignment } from "../actions/category-assignment-actions"

// Enhanced form schema with optional profile image
export const createStudentFormSchema = z.object({
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
    // Make image optional
    image: (typeof window === 'undefined' ? z.any() : z.instanceof(File))
        .refine((file) => file.size <= 5 * 1024 * 1024, "Image size must be less than 5MB")
        .refine(
            (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
            "Only .jpg, .jpeg, .png and .webp formats are supported"
        )
        .optional(),
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
        ).optional()

})

type StudentFormData = z.infer<typeof createStudentFormSchema>

interface AddStudentProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function AddStudent({ isOpen, onClose, onSuccess }: AddStudentProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

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
        resolver: zodResolver(createStudentFormSchema),
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

    // Watch the image field for the ProfileImageUploader
    const selectedImage = form.watch("image")

    // Category Assignment Hook
    const assignHook = useCategoryAssignment()
    const {
        validationResults,
        isFormValid: isCategoryFormValid,
        selectedSubCategoryIds,
        assignedDates,
        durations,
        discounts,
        notes
    } = assignHook

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
                else if (key === 'image') {
                    // If image is provided, append it; otherwise append default image URL
                    if (value instanceof File) {
                        submitData.append('student_image', value)
                    } else {
                        // Append default image URL
                        submitData.append('default_image_url', '/default.jpg')
                    }
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
                } else if (key !== 'image' && key !== 'attachments' && key !== 'qualifications' && key !== 'dob' && key !== 'createdAt' && key !== 'heightUnit' && key !== 'weightUnit' && value != null) {
                    submitData.append(key, String(value))
                }
            })
            console.log("------------Submit Data-------")
            for (const [key, value] of submitData.entries()) {
                console.log(key, value)
            }
            const result = await createStudent(submitData)

            if (result.success) {
                router.refresh()
                toast.success("Student Created Successfully! 🎉", {
                    description: `Student "${values.fullname}" has been added.`,
                    duration: 5000,
                })

                // Assign categories if any selected
                if (selectedSubCategoryIds.length > 0) {
                    if (!isCategoryFormValid) {
                        toast.warning("Student created but categories were not assigned due to validation errors.")
                    } else {
                        try {
                            const assignments: CategoryAssignment[] = validationResults.map(r => ({
                                subCategoryId: r.subCategoryId,
                                discountAmount: r.discount,
                                assignedDate: assignedDates[r.subCategoryId],
                                durationMonths: durations[r.subCategoryId] ? parseInt(durations[r.subCategoryId]) : undefined,
                                notes: notes[r.subCategoryId] || undefined
                            }))

                            const assignResult = await assignCategoriesToStudent(result.student!.id, assignments)
                            if (assignResult.success) {
                                toast.success("Categories assigned successfully! 📚")
                            } else {
                                toast.error("Failed to assign categories: " + assignResult.error)
                            }
                        } catch (assignError) {
                            console.error("Error assigning categories:", assignError)
                            toast.error("Error assigning categories")
                        }
                    }
                }

                // Reset form
                form.reset()
                assignHook.resetForm()
                onClose()
                onSuccess()
            } else {
                toast.error("Failed to Create Student ❌", {
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

    const attachmentCount = form.watch("attachments")?.length || 0;

    const handleCancel = () => {
        form.reset()
        onClose()
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-xl gap-0 pb-2 p-6 md:max-w-2xl lg:max-w-3xl h-full font-medium overflow-y-auto">
                <SheetHeader className="mb-2 p-0 border-b pb-4 gap-0.5">
                    <SheetTitle className="text-xl">Add Student</SheetTitle>
                    <SheetDescription className="text-sm font-normal">
                        Create a new student entry. All fields marked with * are required.
                    </SheetDescription>
                </SheetHeader>
                <Form {...form}>

                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
                        {/* Profile Image */}
                        <div className="flex flex-col space-y-4 border-b pb-6">
                            <h3 className="text-sm font-semibold">Profile Image</h3>
                            <ProfileImageUploader
                                form={form}
                                selectedImage={selectedImage || null}
                                disabled={isSubmitting}
                            />
                            {form.formState.errors.image && (
                                <p className="text-red-500 text-xs mt-1">{getErrorMessage(form.formState.errors.image)}</p>
                            )}
                        </div>

                        {/* Personal Information */}
                        <div className="flex flex-col space-y-4 border-b pb-6">
                            <h3 className="text-base font-semibold">Personal Information</h3>

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
                                        <SelectTrigger className="w-full">
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
                                        <SelectTrigger className="w-full">
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
                                            placeholder="e.g., 65"
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
                            <h3 className="text-base font-semibold">Contact Information</h3>

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
                            <h3 className="text-base font-semibold">Address Information</h3>

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
                            <h3 className="text-base font-semibold">Additional Information</h3>

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

                        {/* Attachments Section */}
                        <div className="flex flex-col space-y-3">
                            <div className="flex items-center gap-2">
                                <Paperclip size={16} />
                                <h3 className="font-medium">Attachments</h3>
                                {attachmentCount > 0 && (
                                    <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                        {attachmentCount} file{attachmentCount !== 1 ? 's' : ''} selected
                                    </span>
                                )}
                            </div>
                            <SelectImages
                                mode="create"
                                form={form}
                                selectedAttachments={form.watch("attachments") || []}
                            />
                            <p className="text-sm text-muted-foreground">
                                Supported formats: Images (JPEG, PNG, WebP, GIF), PDFs, and Office documents. Max 5MB per file.
                            </p>
                        </div>

                        <div className="flex flex-col space-y-3 border-b pb-6">
                            <CategoryAssignmentList
                                assignHook={assignHook}
                                isSubmitting={isSubmitting}
                            />
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
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Student
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
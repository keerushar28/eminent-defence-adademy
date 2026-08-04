'use client'

import { Button } from "@/features/core/components/button"
import { Plus, Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/features/core/components/sheet"
import { Input } from "@/features/core/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/core/components/select"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createSubCategory } from "../actions/category-actions"
import { ICategory } from "../types/types"

const subCategoryFormSchema = z.object({
  name: z.string()
    .min(2, "Subcategory name must be at least 2 characters")
    .max(100, "Subcategory name must not exceed 100 characters")
    .refine((val) => val.trim().length >= 2, "Subcategory name cannot be just spaces"),

  fee: z.string()
    .min(1, "Fee is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Fee must be a valid positive number"),

  categoryId: z.string()
    .min(1, "Please select a category"),
})

type SubCategoryFormData = z.infer<typeof subCategoryFormSchema>

interface AddSubCategoryProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  categories?: ICategory[]
  preselectedCategoryId?: string
}

export default function AddSubCategory({
  isOpen,
  onClose,
  onSuccess,
  categories,
  preselectedCategoryId
}: AddSubCategoryProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    resolver: zodResolver(subCategoryFormSchema),
    defaultValues: {
      name: "",
      fee: "",
      categoryId: "",
    },
  })

  // Set preselected category when component opens
  useEffect(() => {
    if (isOpen && preselectedCategoryId) {
      form.setValue("categoryId", preselectedCategoryId, { shouldValidate: true })
    }
  }, [isOpen, preselectedCategoryId, form])

  const handleSubmit = async (values: SubCategoryFormData) => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      const result = await createSubCategory({
        name: values.name,
        fee: Number(values.fee),
        categoryId: values.categoryId,
      })

      if (result.success) {
        toast.success("Subcategory Created Successfully! 🎉", {
          description: `Subcategory "${values.name}" has been added.`,
          duration: 5000,
        })

        form.reset()
        onSuccess()
      } else {
        toast.error("Failed to Create Subcategory ❌", {
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
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md gap-0 pb-2 p-6 h-full font-medium overflow-y-auto">
        <SheetHeader className="mb-2 p-0 border-b pb-4 gap-0.5">
          <SheetTitle className="text-xl">Add Subcategory</SheetTitle>
          <SheetDescription className="text-sm font-normal">
            Create a new subcategory. All fields marked with * are required.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium block mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <Select
              value={form.watch("categoryId") || ""}
              onValueChange={(value) => form.setValue("categoryId", value, { shouldValidate: true })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.categoryId && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.categoryId.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Subcategory Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter subcategory name (e.g., Sainya, Officer Cadet, Jwan)..."
              {...form.register("name")}
              disabled={isSubmitting}
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Fee (NPR) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter fee amount..."
              {...form.register("fee")}
              disabled={isSubmitting}
            />
            {form.formState.errors.fee && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.fee.message}</p>
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
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subcategory
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
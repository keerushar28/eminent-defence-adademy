'use client'

import { Button } from "@/features/core/components/button"
import { Edit, Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/features/core/components/sheet"
import { Input } from "@/features/core/components/input"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { updateSubCategory } from "../actions/category-actions"
import { ICategory, ISubCategory } from "../types/types"

const subCategoryFormSchema = z.object({
  name: z.string()
    .min(2, "Subcategory name must be at least 2 characters")
    .max(100, "Subcategory name must not exceed 100 characters")
    .refine((val) => val.trim().length >= 2, "Subcategory name cannot be just spaces"),

  fee: z.string()
    .min(1, "Fee is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Fee must be a valid positive number"),
})

type SubCategoryFormData = z.infer<typeof subCategoryFormSchema>

interface EditSubCategoryProps {
  subCategory: ISubCategory
  isOpen: boolean
  onClose: () => void
  categories?: ICategory[]
}

export default function EditSubCategory({ subCategory, isOpen, onClose, categories }: EditSubCategoryProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    resolver: zodResolver(subCategoryFormSchema),
    defaultValues: {
      name: "",
      fee: "",
    },
  })

  // Load subcategory data when modal opens
  useEffect(() => {
    if (isOpen && subCategory) {
      form.reset({
        name: subCategory.name,
        fee: subCategory.fee.toString(),
      })
    }
  }, [isOpen, subCategory, form])

  const handleSubmit = async (values: SubCategoryFormData) => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      const result = await updateSubCategory(subCategory.id, {
        name: values.name,
        fee: Number(values.fee),
      })

      if (result.success) {
        toast.success("Subcategory Updated Successfully! 🎉", {
          description: `Subcategory "${values.name}" has been updated.`,
          duration: 5000,
        })

        onClose()
      } else {
        toast.error("Failed to Update Subcategory ❌", {
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

  // Find the category name for display
  const categoryName = categories?.find(cat => cat.id === subCategory.categoryId)?.name ||
    subCategory.category?.name || 'Unknown Category'

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md gap-0 pb-2 p-6 h-full font-medium overflow-y-auto">
        <SheetHeader className="mb-2 p-0 border-b pb-4 gap-0.5">
          <SheetTitle className="text-xl">Edit Subcategory</SheetTitle>
          <SheetDescription className="text-sm font-normal">
            Update subcategory information. All fields marked with * are required.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium block mb-2">
              Category
            </label>
            <Input
              value={categoryName}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Category cannot be changed. Delete and recreate to move to a different category.
            </p>
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
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update Subcategory
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
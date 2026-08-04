'use client'

import { Button } from "@/features/core/components/button"
import { Edit, Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/features/core/components/sheet"
import { Input } from "@/features/core/components/input"
import { Textarea } from "@/features/core/components/textarea"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { updateCategory } from "../actions/category-actions"
import { ICategory } from "../types/types"

const categoryFormSchema = z.object({
  name: z.string()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name must not exceed 100 characters")
    .refine((val) => val.trim().length >= 2, "Category name cannot be just spaces"),

  description: z.string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
})

type CategoryFormData = z.infer<typeof categoryFormSchema>

interface EditCategoryProps {
  category: ICategory
  isOpen: boolean
  onClose: () => void
}

export default function EditCategory({ category, isOpen, onClose }: EditCategoryProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  // Load category data when modal opens
  useEffect(() => {
    if (isOpen && category) {
      form.reset({
        name: category.name,
        description: category.description || "",
      })
    }
  }, [isOpen, category, form])

  const handleSubmit = async (values: CategoryFormData) => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      const result = await updateCategory(category.id, {
        name: values.name,
        description: values.description || undefined,
      })

      if (result.success) {
        toast.success("Category Updated Successfully! 🎉", {
          description: `Category "${values.name}" has been updated.`,
          duration: 5000,
        })

        onClose()
      } else {
        toast.error("Failed to Update Category ❌", {
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
          <SheetTitle className="text-xl">Edit Category</SheetTitle>
          <SheetDescription className="text-sm font-normal">
            Update category information. All fields marked with * are required.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium block mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter category name (e.g., Nepalese Army, Nepal Police)..."
              {...form.register("name")}
              disabled={isSubmitting}
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Description
            </label>
            <Textarea
              placeholder="Enter category description (optional)..."
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
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update Category
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
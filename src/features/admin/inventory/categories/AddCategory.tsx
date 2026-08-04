"use client";

import { Button } from "@/features/core/components/button";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/features/core/components/sheet";
import { Input } from "@/features/core/components/input";
import { Label } from "@/features/core/components/label";
import { Textarea } from "@/features/core/components/textarea";
import { Checkbox } from "@/features/core/components/checkbox";
import { toast } from "sonner";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCategory } from "../actions/item-actions";

const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional(),
  isBilling: z.boolean(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface AddCategoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultIsBilling?: boolean;
}

export default function AddCategory({ isOpen, onClose, onSuccess, defaultIsBilling = false }: AddCategoryProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      isBilling: defaultIsBilling,
    },
  });

  const handleSubmit = async (values: unknown) => {
    const typedValues = values as CategoryFormData;
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", typedValues.name);
      if (typedValues.description && typedValues.description.trim() !== "") {
        formData.append("description", typedValues.description);
      }
      formData.append("isBilling", String(typedValues.isBilling));

      const result = await createCategory(formData);

      if (result.success) {
        toast.success("Category Created Successfully! 🎉", {
          description: `${typedValues.name} has been added to inventory categories.`,
          duration: 5000,
        });

        form.reset({ name: "", description: "", isBilling: defaultIsBilling });
        onSuccess();
      } else {
        toast.error("Failed to Create Category ❌", {
          description: result.error || "Something went wrong. Please try again.",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Submission Error ❌", {
        description: "An unexpected error occurred. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset({ name: "", description: "", isBilling: defaultIsBilling });
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg gap-0 pb-2 p-6 h-full font-medium overflow-y-auto">
        <SheetHeader className="mb-2 p-0 border-b pb-4 gap-0.5">
          <SheetTitle className="text-xl">Add New Category</SheetTitle>
          <SheetDescription className="text-sm font-normal">
            Create a new inventory category for organizing items
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Category Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Sports Equipment, Stationery, Medical Supplies"
              {...form.register("name")}
              disabled={isSubmitting}
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this category..."
              rows={3}
              {...form.register("description")}
              disabled={isSubmitting}
            />
            {form.formState.errors.description && (
              <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Mark as Billing */}
          {defaultIsBilling === undefined ? (
            <>
              <div className="flex items-center space-x-2 p-3 border rounded-lg bg-blue-50">
                <Checkbox
                  id="isBilling"
                  checked={form.watch("isBilling")}
                  onCheckedChange={(checked) => form.setValue("isBilling", checked as boolean)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="isBilling" className="cursor-pointer font-normal">
                  Mark as Billing Category
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Enable this if this category should appear in the Billing section for recording expenses.
              </p>
            </>
          ) : null}

          {/* Info Box */}
          <div className="border p-3 rounded-lg text-sm text-muted-foreground">
            💡 Categories help organize your inventory items. Common examples: Uniforms, Books, Hostel Supplies, Food Items, Sports Equipment, etc.
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Category"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

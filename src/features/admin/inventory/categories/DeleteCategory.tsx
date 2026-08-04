"use client";

import { Button } from "@/features/core/components/button";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/features/core/components/alert-dialog";
import { toast } from "sonner";
import { useState } from "react";
import { deleteCategory } from "../actions/category-actions";
import { IInventoryCategory } from "../types/inventory-types";

interface DeleteCategoryProps {
  category: IInventoryCategory;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteCategory({ category, isOpen, onClose, onSuccess }: DeleteCategoryProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      const result = await deleteCategory(category.id);

      if (result.success) {
        toast.success("Category Deleted Successfully! 🗑️", {
          description: `${category.name} has been removed.`,
          duration: 5000,
        });

        onSuccess();
      } else {
        toast.error("Failed to Delete Category ❌", {
          description: result.error || "Something went wrong. Please try again.",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Delete Error ❌", {
        description: "An unexpected error occurred. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete <strong>{category.name}</strong>?
            </p>
            <p className="text-red-600 font-medium">
              Warning: This action cannot be undone. All items in this category will need to be reassigned.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Category"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

"use client";

import { Button } from "@/features/core/components/button";
import { CheckSquare2, Loader2 } from "lucide-react";
import {
  getStudentCategoryAssignments,
  assignCategoriesToStudent,
  removeStudentCategory,
  CategoryAssignment,
} from "../../actions/category-assignment-actions";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/features/core/components/dialog";
import { Checkbox } from "@/features/core/components/checkbox";
import { Label } from "@/features/core/components/label";
import { ScrollArea } from "@/features/core/components/scroll-area";
import { DialogTrigger } from "@radix-ui/react-dialog";

interface SelectStudentButtonProps {
  studentId: string;
  studentName: string;
  isSelected: boolean;
  onToggle?: () => void;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  subCategories: SubCategory[];
}

interface SubCategory {
  id: string;
  name: string;
  fee?: number;
}

export default function SelectStudentButton({
  studentId,
  studentName,
  isSelected,
  onToggle,
}: SelectStudentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [initialSubCategoryIds, setInitialSubCategoryIds] = useState<Set<string>>(new Set());
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (dialogOpen) {
      fetchCategoriesAndAssignments();
    }
  }, [dialogOpen, studentId]);

  const fetchCategoriesAndAssignments = async () => {
    setLoadingData(true);
    try {
      const [categoriesResponse, assignments] = await Promise.all([
        fetch("/api/categories?includeSubcategories=true"),
        getStudentCategoryAssignments(studentId),
      ]);

      if (categoriesResponse.ok) {
        const data = await categoriesResponse.json();
        setCategories(data);
      }

      // Get active assigned subcategory IDs
      const activeAssignedIds = assignments
        .filter((a: any) => a.isActive)
        .map((a: any) => a.subCategory?.id)
        .filter(Boolean) as string[];

      setSelectedSubCategories(activeAssignedIds);
      setInitialSubCategoryIds(new Set(activeAssignedIds));
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubCategoryToggle = (subCategoryId: string) => {
    setSelectedSubCategories((prev) =>
      prev.includes(subCategoryId)
        ? prev.filter((id) => id !== subCategoryId)
        : [...prev, subCategoryId]
    );
  };

  const handleConfirmSelection = async () => {
    if (selectedSubCategories.length === 0) {
      toast.error("Please select at least one category");
      return;
    }

    setLoading(true);
    try {
      // 1. Identify removals (categories that were assigned but are now unchecked)
      const toRemove = Array.from(initialSubCategoryIds).filter(
        (id) => !selectedSubCategories.includes(id)
      );

      // Fetch current assignments to get the relation IDs for removal
      if (toRemove.length > 0) {
        const currentAssignments = await getStudentCategoryAssignments(studentId);
        for (const subId of toRemove) {
          const relation = currentAssignments.find((a: any) =>
            (a.subCategoryId === subId || a.subCategory?.id === subId) && a.isActive
          );
          if (relation) {
            await removeStudentCategory(relation.id);
          }
        }
      }

      // 2. Identify additions (newly checked categories)
      const toAdd = selectedSubCategories.filter(
        (id) => !initialSubCategoryIds.has(id)
      );

      if (toAdd.length > 0) {
        const assignments: CategoryAssignment[] = toAdd.map((subCategoryId) => ({
          subCategoryId,
          discountAmount: 0,
          assignedDate: new Date(),
        }));

        const result = await assignCategoriesToStudent(studentId, assignments);
        if (!result.success) {
          toast.error("Failed to assign categories: " + result.error);
          setLoading(false);
          return;
        }
      }

      toast.success("Categories updated successfully");
      setDialogOpen(false);
      onToggle?.();
    } catch (error) {
      console.error("Failed to update categories:", error);
      toast.error("Failed to update categories");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = selectedSubCategories.length !== initialSubCategoryIds.size ||
    selectedSubCategories.some((id) => !initialSubCategoryIds.has(id)) ||
    Array.from(initialSubCategoryIds).some((id) => !selectedSubCategories.includes(id));

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center gap-2 w-full px-2 py-1.5 text-sm cursor-pointer rounded-sm hover:bg-accent">
          <CheckSquare2 className="h-4 w-4" />
          <span>{isSelected ? "Manage Selection" : "Select Student"}</span>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>
            {isSelected ? "Manage" : "Assign"} Categories for {studentName}
          </DialogTitle>
          <DialogDescription>
            Choose which categories this student should be assigned to
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh] pr-4">
          <div className="space-y-6 py-4">
            {loadingData ? (
              <div className="flex items-center justify-center text-sm text-muted-foreground py-8">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                No categories available
              </div>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="space-y-3">
                  <div className="font-semibold text-sm text-primary border-b pb-2">
                    {category.name}
                    {category.description && (
                      <span className="text-xs text-muted-foreground font-normal ml-2">
                        ({category.description})
                      </span>
                    )}
                  </div>
                  {category.subCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground pl-4">
                      No subcategories available
                    </p>
                  ) : (
                    <div className="space-y-2 pl-4">
                      {category.subCategories.map((subCategory) => (
                        <div
                          key={subCategory.id}
                          className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50"
                        >
                          <Checkbox
                            id={`subcategory-${subCategory.id}`}
                            checked={selectedSubCategories.includes(subCategory.id)}
                            onCheckedChange={() =>
                              handleSubCategoryToggle(subCategory.id)
                            }
                          />
                          <Label
                            htmlFor={`subcategory-${subCategory.id}`}
                            className="flex-1 text-sm font-medium cursor-pointer"
                          >
                            {subCategory.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedSubCategories.length} category(ies) assigned
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSelection}
              disabled={loading || selectedSubCategories.length === 0 || !hasChanges}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
import { Avatar, AvatarFallback, AvatarImage } from "@/features/core/components/avatar";
import { Badge } from "@/features/core/components/badge";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { issueToStudent } from "../actions/issuance-actions";
import { getItems } from "../actions/item-actions";
import { getStudents } from "@/features/admin/students/actions/student-actions";
import { IInventoryItem } from "../types/inventory-types";
import { IStudent } from "@/features/admin/students/types/types";
import ItemSelector from "../components/shared/ItemSelector";
import StudentSelectorOptimized from "@/features/admin/components/StudentSelectorOptimized";

const issuanceFormSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  itemId: z.string().min(1, "Item is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be a positive number"),
  notes: z.string().optional(),
});

type IssuanceFormData = z.infer<typeof issuanceFormSchema>;

interface IssueToStudentProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function IssueToStudent({ isOpen, onClose, onSuccess }: IssueToStudentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState<IStudent[]>([]);
  const [items, setItems] = useState<IInventoryItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<IStudent | null>(null);
  const [selectedItem, setSelectedItem] = useState<IInventoryItem | null>(null);

  const form = useForm<IssuanceFormData>({
    resolver: zodResolver(issuanceFormSchema),
    defaultValues: {
      studentId: "",
      itemId: "",
      quantity: 1,
      unitPrice: 0,
      notes: "",
    },
  });

  // Load students and items
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const [studentsData, itemsData] = await Promise.all([
        getStudents(),
        getItems({ isActive: true }),
      ]);
      setStudents(studentsData);
      setItems(itemsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data", {
        description: "Could not load students and items. Please try again.",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  // Handle student selection
  const handleStudentSelect = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    setSelectedStudent(student || null);
    form.setValue("studentId", studentId);
  };

  // Handle item selection
  const handleItemSelect = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    setSelectedItem(item || null);
    form.setValue("itemId", itemId);
    // Auto-set unit price from item if available
    if (item?.unitPrice) {
      form.setValue("unitPrice", Number(item.unitPrice));
    }
  };

  const handleSubmit = async (values: IssuanceFormData) => {
    if (isSubmitting) return;

    // Validate stock availability
    if (selectedItem && selectedItem.currentStock < values.quantity) {
      toast.error("Insufficient Stock", {
        description: `Only ${selectedItem.currentStock} ${selectedItem.unit} available.`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("studentId", values.studentId);
      formData.append("itemId", values.itemId);
      formData.append("quantity", values.quantity.toString());
      formData.append("unitPrice", values.unitPrice.toString());
      formData.append("totalAmount", (values.quantity * values.unitPrice).toString());
      formData.append("notes", values.notes || "");

      // Get current user ID (you may need to adjust this based on your auth setup)
      const issuedBy = "current-user-id"; // TODO: Get from session

      const result = await issueToStudent(formData, issuedBy);

      if (result.success) {
        toast.success("Item Issued Successfully! 🎉", {
          description: `${values.quantity} ${selectedItem?.unit} of ${selectedItem?.name} issued to ${selectedStudent?.fullname}.`,
          duration: 5000,
        });

        form.reset();
        setSelectedStudent(null);
        setSelectedItem(null);
        onSuccess();
      } else {
        toast.error("Failed to Issue Item ❌", {
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
    form.reset();
    setSelectedStudent(null);
    setSelectedItem(null);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose} modal>
      <SheetContent className="w-full sm:max-w-2xl gap-0 pb-2 p-6 h-full font-medium overflow-y-auto">
        <SheetHeader className="mb-2 p-0 border-b pb-4 gap-0.5">
          <SheetTitle className="text-xl">Issue Item to Student</SheetTitle>
          <SheetDescription className="text-sm font-normal">
            Issue inventory items to a student. All fields marked with * are required.
          </SheetDescription>
        </SheetHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
            {/* Student Selection */}
            <div className="flex flex-col space-y-4">
              <h3 className="text-lg font-medium">Student Information</h3>

              <div>
                <label className="text-sm font-medium block mb-2">
                  Student <span className="text-red-500">*</span>
                </label>
                <StudentSelectorOptimized
                  value={form.watch("studentId")}
                  onValueChange={handleStudentSelect}
                  disabled={isSubmitting}
                  placeholder="Search and select student..."
                  showAvatar={true}
                  showEmail={true}
                  showPhone={true}
                  showCategories={true}
                />
              </div>

              {selectedStudent && (
                <div className="border rounded-lg p-4 bg-accent/50">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedStudent.student_image} alt={selectedStudent.fullname} />
                      <AvatarFallback>{selectedStudent.fullname.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">{selectedStudent.fullname}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(null);
                            form.setValue("studentId", "");
                          }}
                          disabled={isSubmitting}
                        >
                          Change
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1 mt-1">
                        <div>Email: {selectedStudent.email}</div>
                        <div>Contact: {selectedStudent.contact_number_student}</div>
                        {selectedStudent.studentCategories && selectedStudent.studentCategories.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <span>Categories:</span>
                            {selectedStudent.studentCategories.map((sc) => (
                              <Badge key={sc.id} variant="secondary" className="text-xs">
                                {sc.subCategory?.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {form.formState.errors.studentId && (
                <p className="text-red-500 text-xs">
                  {form.formState.errors.studentId.message}
                </p>
              )}
            </div>

            {/* Item Selection */}
            <div className="flex flex-col space-y-4">
              <h3 className="text-lg font-medium">Item Information</h3>

              <div>
                <label className="text-sm font-medium block mb-2">
                  Item <span className="text-red-500">*</span>
                </label>
                <ItemSelector
                  items={items}
                  value={form.watch("itemId")}
                  onValueChange={handleItemSelect}
                  disabled={isSubmitting}
                  placeholder="Search and select item..."
                  showStock={true}
                  showCategory={true}
                  showSKU={true}
                  filterByStock={false}
                />
                {form.formState.errors.itemId && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.itemId.message}
                  </p>
                )}
              </div>

              {selectedItem && (
                <div className="border rounded-lg p-4 bg-accent/50">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{selectedItem.name}</span>
                      <Badge variant={selectedItem.currentStock > selectedItem.minStockThreshold ? "default" : "destructive"}>
                        {selectedItem.currentStock} {selectedItem.unit} available
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>Category: {selectedItem.category?.name}</div>
                      <div>SKU: {selectedItem.sku}</div>
                      {selectedItem.currentStock <= selectedItem.minStockThreshold && (
                        <div className="text-red-500 font-medium mt-2">
                          ⚠️ Low stock warning
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium block mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max={selectedItem?.currentStock || undefined}
                  placeholder="Enter quantity"
                  {...form.register("quantity", {
                    valueAsNumber: true,
                  })}
                  disabled={isSubmitting || !selectedItem}
                />
                {form.formState.errors.quantity && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.quantity.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">
                  Unit Price (NPR) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter unit price"
                  {...form.register("unitPrice", {
                    valueAsNumber: true,
                  })}
                  disabled={isSubmitting || !selectedItem}
                />
                {form.formState.errors.unitPrice && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.unitPrice.message}
                  </p>
                )}
                {selectedItem && form.watch("quantity") > 0 && form.watch("unitPrice") > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Total Amount: NPR {(form.watch("quantity") * form.watch("unitPrice")).toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Notes</label>
                <Input
                  placeholder="Enter any notes..."
                  {...form.register("notes")}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedStudent || !selectedItem}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Issuing...
                  </>
                ) : (
                  "Issue Item"
                )}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}

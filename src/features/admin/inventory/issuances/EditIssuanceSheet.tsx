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
import { IStudentIssuance, IInventoryItem, IssuanceStatus } from "../types/inventory-types";
import { updateIssuance } from "../actions/issuance-actions";
import { getItems } from "../actions/item-actions";
import { getStudents } from "@/features/admin/students/actions/student-actions";
import { IStudent } from "@/features/admin/students/types/types";
import ItemSelector from "../components/shared/ItemSelector";
import StudentSelectorOptimized from "@/features/admin/components/StudentSelectorOptimized";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/core/components/select";

const editIssuanceSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  itemId: z.string().min(1, "Item is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be a positive number"),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
});

type EditIssuanceFormData = z.infer<typeof editIssuanceSchema>;

interface EditIssuanceSheetProps {
  issuance: IStudentIssuance;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function formatStatus(status: IssuanceStatus): string {
  switch (status) {
    case "ISSUED": return "Issued";
    case "PARTIALLY_RETURNED": return "Partially Returned";
    case "RETURNED": return "Returned";
    default: return status;
  }
}

export default function EditIssuanceSheet({
  issuance,
  isOpen,
  onClose,
  onSuccess,
}: EditIssuanceSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState<IStudent[]>([]);
  const [items, setItems] = useState<IInventoryItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<IStudent | null>(null);
  const [selectedItem, setSelectedItem] = useState<IInventoryItem | null>(null);

  const form = useForm<EditIssuanceFormData>({
    resolver: zodResolver(editIssuanceSchema),
    defaultValues: {
      studentId: issuance.studentId,
      itemId: issuance.itemId,
      quantity: issuance.quantity,
      unitPrice: Number(issuance.unitPrice) || 0,
      status: issuance.status,
      notes: issuance.notes || "",
    },
  });

  // Load students and items, then set proper selections
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

      // Set initial selections
      const student = studentsData.find((s) => s.id === issuance.studentId);
      setSelectedStudent(student || null);

      const item = itemsData.find((i) => i.id === issuance.itemId);
      setSelectedItem(item || null);

      // Reset form with correct values after data loads
      form.reset({
        studentId: issuance.studentId,
        itemId: issuance.itemId,
        quantity: issuance.quantity,
        unitPrice: Number(issuance.unitPrice) || 0,
        status: issuance.status,
        notes: issuance.notes || "",
      });
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data", {
        description: "Could not load students and items. Please try again.",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleStudentSelect = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    setSelectedStudent(student || null);
    form.setValue("studentId", studentId);
  };

  const handleItemSelect = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    setSelectedItem(item || null);
    form.setValue("itemId", itemId);
    if (item?.unitPrice) {
      form.setValue("unitPrice", Number(item.unitPrice));
    }
  };

  const handleSubmit = async (values: EditIssuanceFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("studentId", values.studentId);
      formData.append("itemId", values.itemId);
      formData.append("quantity", values.quantity.toString());
      formData.append("unitPrice", values.unitPrice.toString());
      formData.append("status", values.status);
      formData.append("notes", values.notes || "");

      const result = await updateIssuance(issuance.id, formData);

      if (result.success) {
        toast.success("Issuance Updated", {
          description: "Issuance has been updated successfully.",
          duration: 5000,
        });
        onSuccess();
      } else {
        toast.error("Failed to Update Issuance", {
          description: result.error || "Something went wrong. Please try again.",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error updating issuance:", error);
      toast.error("Error", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose} modal>
      <SheetContent className="w-full sm:max-w-2xl gap-0 pb-2 p-6 h-full font-medium overflow-y-auto">
        <SheetHeader className="mb-2 p-0 border-b pb-4 gap-0.5">
          <SheetTitle className="text-xl">Edit Issuance</SheetTitle>
          <SheetDescription className="text-sm font-normal">
            Update issuance details. Stock will be adjusted automatically if quantity or item changes.
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
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={issuance.returnedQty || 1}
                    placeholder="Enter quantity"
                    {...form.register("quantity", {
                      valueAsNumber: true,
                    })}
                    disabled={isSubmitting || !selectedItem}
                  />
                  {issuance.returnedQty > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Min: {issuance.returnedQty} (returned)
                    </p>
                  )}
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
                </div>
              </div>

              {form.watch("quantity") > 0 && form.watch("unitPrice") > 0 && (
                <p className="text-sm text-muted-foreground">
                  Total Amount: NPR {(form.watch("quantity") * form.watch("unitPrice")).toFixed(2)}
                </p>
              )}

              {/* Status Selection */}
              <div>
                <label className="text-sm font-medium block mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) => form.setValue("status", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ISSUED">Issued</SelectItem>
                    <SelectItem value="PARTIALLY_RETURNED">Partially Returned</SelectItem>
                    <SelectItem value="RETURNED">Returned</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.status && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.status.message}
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
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedStudent || !selectedItem}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}

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
import { Checkbox } from "@/features/core/components/checkbox";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateItem } from "../actions/item-actions";
import { getVendors } from "../actions/vendor-actions";
import { IInventoryCategory, IInventoryItem, IVendor } from "../types/inventory-types";
import {  VALIDATION_CONSTANTS } from "../constants/inventory-constants";
import CategorySelector from "../components/shared/CategorySelector";
import UnitSelector from "../components/shared/UnitSelector";

const itemFormSchema = z.object({
  name: z
    .string()
    .min(VALIDATION_CONSTANTS.ITEM_NAME_MIN_LENGTH, `Item name must be at least ${VALIDATION_CONSTANTS.ITEM_NAME_MIN_LENGTH} characters`)
    .max(VALIDATION_CONSTANTS.ITEM_NAME_MAX_LENGTH, `Item name must not exceed ${VALIDATION_CONSTANTS.ITEM_NAME_MAX_LENGTH} characters`),
  description: z
    .string()
    .max(VALIDATION_CONSTANTS.ITEM_DESCRIPTION_MAX_LENGTH, `Description must not exceed ${VALIDATION_CONSTANTS.ITEM_DESCRIPTION_MAX_LENGTH} characters`)
    .optional(),
  categoryId: z.string().min(1, "Category is required"),
  sku: z
    .string()
    .min(VALIDATION_CONSTANTS.ITEM_SKU_MIN_LENGTH, `SKU must be at least ${VALIDATION_CONSTANTS.ITEM_SKU_MIN_LENGTH} characters`)
    .max(VALIDATION_CONSTANTS.ITEM_SKU_MAX_LENGTH, `SKU must not exceed ${VALIDATION_CONSTANTS.ITEM_SKU_MAX_LENGTH} characters`)
    .regex(VALIDATION_CONSTANTS.ITEM_SKU_PATTERN, "SKU must contain only uppercase letters, numbers, and hyphens"),
  unit: z.string().min(1, "Unit is required"),
  minStockThreshold: z
    .number()
    .min(VALIDATION_CONSTANTS.MIN_STOCK_THRESHOLD_MIN, `Minimum stock threshold must be at least ${VALIDATION_CONSTANTS.MIN_STOCK_THRESHOLD_MIN}`)
    .max(VALIDATION_CONSTANTS.MIN_STOCK_THRESHOLD_MAX, `Minimum stock threshold must not exceed ${VALIDATION_CONSTANTS.MIN_STOCK_THRESHOLD_MAX}`),
  unitPrice: z
    .number()
    .min(VALIDATION_CONSTANTS.UNIT_PRICE_MIN, `Unit price must be at least ${VALIDATION_CONSTANTS.UNIT_PRICE_MIN}`)
    .max(VALIDATION_CONSTANTS.UNIT_PRICE_MAX, `Unit price must not exceed ${VALIDATION_CONSTANTS.UNIT_PRICE_MAX}`)
    .optional()
    .or(z.literal("")),
  isActive: z.boolean(),
  vendorIds: z.array(z.string()).optional(),
});

type ItemFormData = z.infer<typeof itemFormSchema>;

interface EditItemProps {
  item: IInventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: IInventoryCategory[];
}

export default function EditItem({ item, isOpen, onClose, onSuccess, categories }: EditItemProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendors, setVendors] = useState<IVendor[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: item.name,
      description: item.description || "",
      categoryId: item.categoryId,
      sku: item.sku,
      unit: item.unit,
      minStockThreshold: item.minStockThreshold,
      unitPrice: item.unitPrice || "",
      isActive: item.isActive,
      vendorIds: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      loadVendors();
      // Set initial selected vendors
      if (item.vendors) {
        setSelectedVendors(item.vendors.map((v) => v.vendorId));
      }
    }
  }, [isOpen, item]);

  const loadVendors = async () => {
    try {
      const vendorList = await getVendors();
      setVendors(vendorList.filter((v) => v.isActive));
    } catch (error) {
      console.error("Error loading vendors:", error);
      toast.error("Failed to load vendors");
    }
  };

  const handleVendorToggle = (vendorId: string) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId)
        ? prev.filter((id) => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleSubmit = async (values: ItemFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description || "");
      formData.append("categoryId", values.categoryId);
      formData.append("sku", values.sku);
      formData.append("unit", values.unit);
      formData.append("minStockThreshold", String(values.minStockThreshold));
      if (values.unitPrice) {
        formData.append("unitPrice", String(values.unitPrice));
      }
      formData.append("isActive", String(values.isActive));
      formData.append("vendorIds", JSON.stringify(selectedVendors));

      const result = await updateItem(item.id, formData);

      if (result.success) {
        toast.success("Item Updated Successfully! 🎉", {
          description: `Item "${values.name}" has been updated.`,
          duration: 5000,
        });

        onSuccess();
      } else {
        toast.error("Failed to Update Item ❌", {
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
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl gap-0 pb-2 p-6 h-full font-medium overflow-y-auto">
        <SheetHeader className="mb-2 p-0 border-b pb-4 gap-0.5">
          <SheetTitle className="text-xl">Edit Inventory Item</SheetTitle>
          <SheetDescription className="text-sm font-normal">
            Update inventory item details. All fields marked with * are required.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
          {/* Basic Information */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>

            <div>
              <label className="text-sm font-medium block mb-2">
                Item Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter item name..."
                {...form.register("name")}
                disabled={isSubmitting}
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Description</label>
              <Input
                placeholder="Enter item description..."
                {...form.register("description")}
                disabled={isSubmitting}
              />
              {form.formState.errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                SKU <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., UNI-001"
                {...form.register("sku")}
                disabled={isSubmitting}
              />
              {form.formState.errors.sku && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.sku.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <CategorySelector
                categories={categories}
                value={form.watch("categoryId")}
                onValueChange={(value) => form.setValue("categoryId", value)}
                disabled={isSubmitting}
                placeholder="Search and select category..."
                showDescription={true}
              />
              {form.formState.errors.categoryId && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.categoryId.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Unit of Measurement <span className="text-red-500">*</span>
              </label>
              <UnitSelector
                value={form.watch("unit")}
                onValueChange={(value) => form.setValue("unit", value)}
                disabled={isSubmitting}
                placeholder="Search and select unit..."
              />
              {form.formState.errors.unit && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.unit.message}
                </p>
              )}
            </div>
          </div>

          {/* Stock & Pricing */}
          <div className="flex flex-col space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium">Stock & Pricing</h3>

            <div>
              <label className="text-sm font-medium block mb-2">
                Current Stock: {item.currentStock} {item.unit}
              </label>
              <p className="text-xs text-muted-foreground">
                Stock quantity is managed through orders and issuances
              </p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Minimum Stock Threshold <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                placeholder="10"
                {...form.register("minStockThreshold", { valueAsNumber: true })}
                disabled={isSubmitting}
              />
              {form.formState.errors.minStockThreshold && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.minStockThreshold.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Unit Price</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...form.register("unitPrice", { 
                  setValueAs: (value) => value === "" ? "" : parseFloat(value) 
                })}
                disabled={isSubmitting}
              />
              {form.formState.errors.unitPrice && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.unitPrice.message}
                </p>
              )}
            </div>
          </div>

          {/* Vendor Association */}
          <div className="flex flex-col space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium">Associated Vendors</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <div key={vendor.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`vendor-${vendor.id}`}
                      checked={selectedVendors.includes(vendor.id)}
                      onCheckedChange={() => handleVendorToggle(vendor.id)}
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor={`vendor-${vendor.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {vendor.name}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No active vendors available</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2 pt-4 border-t">
            <Checkbox
              id="isActive"
              checked={form.watch("isActive")}
              onCheckedChange={(checked) => form.setValue("isActive", checked as boolean)}
              disabled={isSubmitting}
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Active Item
            </label>
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
                  Updating...
                </>
              ) : (
                "Update Item"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

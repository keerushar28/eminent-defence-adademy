"use client";

import { Button } from "@/features/core/components/button";
import { Loader2, Plus, Trash2, Info } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/features/core/components/sheet";
import { Input } from "@/features/core/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/core/components/select";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateOrder } from "../actions/order-actions";
import { getVendors } from "../actions/vendor-actions";
import { getItems } from "../actions/item-actions";
import { IVendor, IInventoryItem, IOrder } from "../types/inventory-types";
import ItemSelector from "../components/shared/ItemSelector";
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker";

const orderItemSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be 0 or greater"),
});

const orderFormSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  expectedDelivery: z.string().optional(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

interface EditOrderProps {
  order: IOrder;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const convertDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function EditOrder({ order, isOpen, onClose, onSuccess }: EditOrderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendors, setVendors] = useState<IVendor[]>([]);
  const [items, setItems] = useState<IInventoryItem[]>([]);
  const [expectedDeliveryAD, setExpectedDeliveryAD] = useState<Date | undefined>(
    order.expectedDelivery ? new Date(order.expectedDelivery) : undefined
  );

  const isItemsLocked = order.status === "PARTIALLY_RECEIVED";

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      vendorId: order.vendorId,
      expectedDelivery: order.expectedDelivery
        ? convertDateToYYYYMMDD(new Date(order.expectedDelivery))
        : "",
      notes: order.notes || "",
      items: order.items?.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })) || [{ itemId: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (isOpen) {
      setExpectedDeliveryAD(
        order.expectedDelivery ? new Date(order.expectedDelivery) : undefined
      );
      form.reset({
        vendorId: order.vendorId,
        expectedDelivery: order.expectedDelivery
          ? convertDateToYYYYMMDD(new Date(order.expectedDelivery))
          : "",
        notes: order.notes || "",
        items: order.items?.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })) || [{ itemId: "", quantity: 1, unitPrice: 0 }],
      });

      // Load dropdown data in background without blocking UI
      getVendors().then(setVendors).catch(() => {});
      getItems({ isActive: true }).then(setItems).catch(() => {});
    }
  }, [isOpen, order, form]);

  useEffect(() => {
    if (expectedDeliveryAD) {
      form.setValue("expectedDelivery", convertDateToYYYYMMDD(expectedDeliveryAD));
    } else {
      form.setValue("expectedDelivery", "");
    }
  }, [expectedDeliveryAD, form]);

  const calculateTotal = () => {
    const itemsData = form.watch("items");
    return itemsData.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      return sum + quantity * unitPrice;
    }, 0);
  };

  const handleItemSelect = (index: number, itemId: string) => {
    const selectedItem = items.find((item) => item.id === itemId);
    if (selectedItem && selectedItem.unitPrice) {
      form.setValue(`items.${index}.unitPrice`, selectedItem.unitPrice);
    }
  };

  const handleSubmit = async (values: OrderFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("vendorId", values.vendorId);
      if (values.expectedDelivery) {
        formData.append("expectedDelivery", values.expectedDelivery);
      } else {
        formData.append("expectedDelivery", "");
      }
      formData.append("notes", values.notes || "");
      formData.append("items", JSON.stringify(values.items));

      const result = await updateOrder(order.id, formData);

      if (result.success) {
        toast.success("Order Updated Successfully!", {
          description: result.message || `Order ${order.orderNumber} has been updated.`,
          duration: 5000,
        });

        form.reset();
        onSuccess();
      } else {
        toast.error("Failed to Update Order", {
          description: result.error || "Something went wrong. Please try again.",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Submission Error", {
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

  const totalAmount = calculateTotal();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-3xl gap-0 pb-2 p-6 h-full font-medium overflow-y-auto">
        <SheetHeader className="mb-2 p-0 border-b pb-4 gap-0.5">
          <SheetTitle className="text-xl">Edit Order</SheetTitle>
          <SheetDescription className="text-sm font-normal">
            Update order details for <strong>{order.orderNumber}</strong>. Only changed fields will be saved.
          </SheetDescription>
        </SheetHeader>

        {isItemsLocked && (
          <div className="flex items gap-2 p-3 mt-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Items are locked</p>
              <p className="text-blue-700">
                This order has been partially received. Items cannot be modified, but you can still update vendor, delivery date, and notes.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
            {/* Order Information */}
            <div className="flex flex-col space-y-4">
              <h3 className="text-lg font-medium">Order Information</h3>

              <div>
                <label className="text-sm font-medium block mb-2">
                  Vendor <span className="text-red-500">*</span>
                </label>
                <Select
                  onValueChange={form.setValue.bind(null, "vendorId")}
                  value={form.watch("vendorId")}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select vendor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.filter((v) => v.isActive).length > 0 ? (
                      vendors
                        .filter((v) => v.isActive)
                        .map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))
                    ) : (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No active vendors available.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.vendorId && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.vendorId.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">
                  Expected Delivery (BS) <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                </label>
                <NepaliDatePicker
                  value={expectedDeliveryAD}
                  onChange={(date) => {
                    if (date instanceof Date) {
                      setExpectedDeliveryAD(date);
                    }
                  }}
                  placeholder="Select delivery date"
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">
                  Notes <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                </label>
                <Input
                  placeholder="Enter any notes..."
                  {...form.register("notes")}
                  disabled={isSubmitting}
                />
                {form.formState.errors.notes && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.notes.message}
                  </p>
                )}
              </div>
            </div>

            {/* Order Items */}
            {!isItemsLocked && (
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Order Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ itemId: "", quantity: 1, unitPrice: 0 })}
                    disabled={isSubmitting}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Item {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Item <span className="text-red-500">*</span>
                      </label>
                      <ItemSelector
                        items={items}
                        value={form.watch(`items.${index}.itemId`)}
                        onValueChange={(value) => {
                          form.setValue(`items.${index}.itemId`, value);
                          handleItemSelect(index, value);
                        }}
                        disabled={isSubmitting}
                        placeholder="Search and select item..."
                        showStock={true}
                        showCategory={true}
                        showSKU={true}
                        filterByStock={false}
                      />
                      {form.formState.errors.items?.[index]?.itemId && (
                        <p className="text-red-500 text-xs mt-1">
                          {form.formState.errors.items[index]?.itemId?.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium block mb-2">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="0"
                          {...form.register(`items.${index}.quantity`, {
                            valueAsNumber: true,
                          })}
                          disabled={isSubmitting}
                        />
                        {form.formState.errors.items?.[index]?.quantity && (
                          <p className="text-red-500 text-xs mt-1">
                            {form.formState.errors.items[index]?.quantity?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium block mb-2">
                          Unit Price <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...form.register(`items.${index}.unitPrice`, {
                            valueAsNumber: true,
                          })}
                          disabled={isSubmitting}
                        />
                        {form.formState.errors.items?.[index]?.unitPrice && (
                          <p className="text-red-500 text-xs mt-1">
                            {form.formState.errors.items[index]?.unitPrice?.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Subtotal: NPR{" "}
                      {(
                        (form.watch(`items.${index}.quantity`) || 0) *
                        (form.watch(`items.${index}.unitPrice`) || 0)
                      ).toFixed(2)}
                    </div>
                  </div>
                ))}

                {form.formState.errors.items && (
                  <p className="text-red-500 text-xs">
                    {form.formState.errors.items.message}
                  </p>
                )}
              </div>
            )}

            {/* Total Amount */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount:</span>
                <span>NPR {totalAmount.toFixed(2)}</span>
              </div>
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
                  "Update Order"
                )}
              </Button>
            </div>
            </form>
      </SheetContent>
    </Sheet>
  );
}

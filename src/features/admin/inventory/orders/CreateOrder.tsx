"use client";

import { Button } from "@/features/core/components/button";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/features/core/components/form";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrder } from "../actions/order-actions";
import { getVendors } from "../actions/vendor-actions";
import { getItems } from "../actions/item-actions";
import { IVendor, IInventoryItem } from "../types/inventory-types";
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

interface CreateOrderProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Convert Date to YYYY-MM-DD format to avoid timezone issues
const convertDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CreateOrder({ isOpen, onClose, onSuccess }: CreateOrderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendors, setVendors] = useState<IVendor[]>([]);
  const [items, setItems] = useState<IInventoryItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [expectedDeliveryAD, setExpectedDeliveryAD] = useState<Date | undefined>(undefined);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      vendorId: "",
      expectedDelivery: "",
      notes: "",
      items: [{ itemId: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Load vendors and items
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Update expectedDelivery when date changes
  useEffect(() => {
    if (expectedDeliveryAD) {
      form.setValue("expectedDelivery", convertDateToYYYYMMDD(expectedDeliveryAD));
    } else {
      form.setValue("expectedDelivery", "");
    }
  }, [expectedDeliveryAD, form]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const [vendorsData, itemsData] = await Promise.all([
        getVendors(),
        getItems({ isActive: true }),
      ]);
      setVendors(vendorsData);
      setItems(itemsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data", {
        description: "Could not load vendors and items. Please try again.",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  // Calculate total amount
  const calculateTotal = () => {
    const itemsData = form.watch("items");
    return itemsData.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      return sum + quantity * unitPrice;
    }, 0);
  };

  // Handle item selection - auto-fill unit price
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
      }
      formData.append("notes", values.notes || "");
      formData.append("items", JSON.stringify(values.items));

      // Get current user ID (you may need to adjust this based on your auth setup)
      const createdBy = "current-user-id"; // TODO: Get from session

      const result = await createOrder(formData, createdBy);

      if (result.success) {
        toast.success("Order Created Successfully! 🎉", {
          description: `Order has been created with ${values.items.length} item(s).`,
          duration: 5000,
        });

        form.reset();
        onSuccess();
      } else {
        toast.error("Failed to Create Order ❌", {
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

  const totalAmount = calculateTotal();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-3xl gap-0 pb-2 p-6 h-full font-medium overflow-y-auto">
        <SheetHeader className="mb-2 p-0 border-b pb-4 gap-0.5">
          <SheetTitle className="text-xl">Create Order</SheetTitle>
          <SheetDescription className="text-sm font-normal">
            Create a new purchase order. All fields marked with * are required.
          </SheetDescription>
        </SheetHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
              {/* Order Information */}
              <div className="flex flex-col space-y-4">
                <h3 className="text-lg font-medium">Order Information</h3>

                <FormField
                  control={form.control}
                  name="vendorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting || vendors.filter((v) => v.isActive).length === 0}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={vendors.filter((v) => v.isActive).length === 0 ? "No active vendors available" : "Select vendor..."} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vendors.filter((v) => v.isActive).length > 0 ? (
                            vendors.filter((v) => v.isActive).map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                {vendor.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                              No active vendors available. Please create a vendor first.
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedDelivery"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Delivery (BS) <span className="text-muted-foreground text-xs font-normal">(Optional)</span></FormLabel>
                      <FormControl>
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
                      </FormControl>
                      <FormMessage />
                      <input type="hidden" {...field} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes <span className="text-muted-foreground text-xs font-normal">(Optional)</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter any notes..."
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            {/* Order Items */}
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
                    Subtotal: NPR 
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
                    Creating...
                  </>
                ) : (
                  "Create Order"
                )}
              </Button>
            </div>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}

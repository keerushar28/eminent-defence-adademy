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
import { updateVendor } from "../actions/vendor-actions";
import { IVendor } from "../types/inventory-types";

const vendorFormSchema = z.object({
  name: z.string().min(2, "Vendor name must be at least 2 characters"),
  contactPerson: z.string().optional(),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  address: z.string().optional(),
  isActive: z.boolean(),
});

type VendorFormData = z.infer<typeof vendorFormSchema>;

interface EditVendorProps {
  vendor: IVendor;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditVendor({
  vendor,
  isOpen,
  onClose,
  onSuccess,
}: EditVendorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: vendor.name,
      contactPerson: vendor.contactPerson || "",
      email: vendor.email || "",
      phone: vendor.phone,
      address: vendor.address || "",
      isActive: vendor.isActive,
    },
  });

  // Update form when vendor changes
  useEffect(() => {
    form.reset({
      name: vendor.name,
      contactPerson: vendor.contactPerson || "",
      email: vendor.email || "",
      phone: vendor.phone,
      address: vendor.address || "",
      isActive: vendor.isActive,
    });
  }, [vendor, form]);

  const handleSubmit = async (values: VendorFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("contactPerson", values.contactPerson || "");
      formData.append("email", values.email || "");
      formData.append("phone", values.phone);
      formData.append("address", values.address || "");
      formData.append("isActive", String(values.isActive));

      const result = await updateVendor(vendor.id, formData);

      if (result.success) {
        toast.success("Vendor Updated Successfully! 🎉", {
          description: `Vendor "${values.name}" has been updated.`,
          duration: 5000,
        });

        onSuccess();
      } else {
        toast.error("Failed to Update Vendor ❌", {
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
          <SheetTitle className="text-xl">Edit Vendor</SheetTitle>
          <SheetDescription className="text-sm font-normal">
            Update vendor information. All fields marked with * are required.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
          {/* Vendor Information */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-medium">Vendor Information</h3>

            <div>
              <label className="text-sm font-medium block mb-2">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter vendor name..."
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
              <label className="text-sm font-medium block mb-2">Contact Person</label>
              <Input
                placeholder="Enter contact person name..."
                {...form.register("contactPerson")}
                disabled={isSubmitting}
              />
              {form.formState.errors.contactPerson && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.contactPerson.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter phone number..."
                {...form.register("phone")}
                disabled={isSubmitting}
              />
              {form.formState.errors.phone && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Email</label>
              <Input
                type="email"
                placeholder="Enter email address..."
                {...form.register("email")}
                disabled={isSubmitting}
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Address</label>
              <Input
                placeholder="Enter address..."
                {...form.register("address")}
                disabled={isSubmitting}
              />
              {form.formState.errors.address && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.address.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={form.watch("isActive")}
                onCheckedChange={(checked) => form.setValue("isActive", checked as boolean)}
                disabled={isSubmitting}
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active Vendor
              </label>
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
                "Update Vendor"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

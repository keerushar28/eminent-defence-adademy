"use client";

import { Button } from "@/features/core/components/button";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/features/core/components/dialog";
import { Input } from "@/features/core/components/input";
import { Label } from "@/features/core/components/label";
import { toast } from "sonner";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { returnIssuance } from "../actions/issuance-actions";
import { IStudentIssuance } from "../types/inventory-types";

const returnFormSchema = z.object({
  returnedQty: z.number().min(1, "Return quantity must be at least 1"),
  notes: z.string().optional(),
});

type ReturnFormData = z.infer<typeof returnFormSchema>;

interface ReturnItemProps {
  issuance: IStudentIssuance;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnItem({ issuance, isOpen, onClose, onSuccess }: ReturnItemProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingQty = issuance.quantity - issuance.returnedQty;

  const form = useForm<ReturnFormData>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      returnedQty: remainingQty,
      notes: "",
    },
  });

  const handleSubmit = async (values: ReturnFormData) => {
    if (isSubmitting) return;

    // Validate return quantity
    if (values.returnedQty > remainingQty) {
      toast.error("Invalid Quantity", {
        description: `Cannot return more than ${remainingQty} ${issuance.item?.unit}.`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("returnedQty", values.returnedQty.toString());
      formData.append("notes", values.notes || "");

      // Get current user ID (you may need to adjust this based on your auth setup)
      const performedBy = "current-user-id"; // TODO: Get from session

      const result = await returnIssuance(issuance.id, formData, performedBy);

      if (result.success) {
        toast.success("Item Returned Successfully! 🎉", {
          description: result.message || `${values.returnedQty} ${issuance.item?.unit} returned.`,
          duration: 5000,
        });

        form.reset();
        onSuccess();
      } else {
        toast.error("Failed to Return Item ❌", {
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Return Item</DialogTitle>
          <DialogDescription>
            Return items from student: {issuance.student?.fullname}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Item Information */}
          <div className="border rounded-lg p-4 bg-accent/50">
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">{issuance.item?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {issuance.item?.category?.name} • SKU: {issuance.item?.sku}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Issued</p>
                  <p className="font-medium">
                    {issuance.quantity} {issuance.item?.unit}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Returned</p>
                  <p className="font-medium">
                    {issuance.returnedQty} {issuance.item?.unit}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Remaining</p>
                  <p className="font-medium">
                    {remainingQty} {issuance.item?.unit}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Return Quantity */}
          <div className="space-y-2">
            <Label htmlFor="returnedQty">
              Return Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="returnedQty"
              type="number"
              min="1"
              max={remainingQty}
              placeholder="Enter quantity to return"
              {...form.register("returnedQty", {
                valueAsNumber: true,
              })}
              disabled={isSubmitting}
            />
            {form.formState.errors.returnedQty && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.returnedQty.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Maximum: {remainingQty} {issuance.item?.unit}
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              placeholder="Enter any notes about the return..."
              {...form.register("notes")}
              disabled={isSubmitting}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Return Item"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

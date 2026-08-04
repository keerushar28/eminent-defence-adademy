"use client";

import { IStudentIssuance } from "../types/inventory-types";
import { deleteIssuance } from "../actions/issuance-actions";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/features/core/components/alert-dialog";

interface DeleteIssuanceDialogProps {
  issuance: IStudentIssuance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function DeleteIssuanceDialog({
  issuance,
  open,
  onOpenChange,
  onSuccess,
}: DeleteIssuanceDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!issuance) return null;

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteIssuance(issuance.id);

      if (result.success) {
        toast.success("Issuance Moved to Trash", {
          description: `Issuance for "${issuance.item?.name || "item"}" to ${issuance.student?.fullname || "student"} has been moved to trash.`,
          duration: 5000,
        });

        onOpenChange(false);
        onSuccess();
      } else {
        toast.error("Failed to Delete Issuance", {
          description: result.error || "Something went wrong. Please try again.",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error deleting issuance:", error);
      toast.error("Error", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Move to Trash?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to move this issuance to trash?
            <br /><br />
            <div className="border rounded-lg p-3 bg-accent/50 text-sm space-y-1">
              <div><strong>Student:</strong> {issuance.student?.fullname || "-"}</div>
              <div><strong>Item:</strong> {issuance.item?.name || "-"}</div>
              <div><strong>Quantity:</strong> {issuance.quantity} {issuance.item?.unit || ""}</div>
              <div><strong>Status:</strong> {issuance.status.replace(/_/g, " ").toLowerCase()}</div>
            </div>
            <br />
            This issuance can be restored from the trash section later if needed.
            {issuance.status === "RETURNED" && (
              <>
                <br /><br />
                <span className="text-muted-foreground text-xs">
                  Note: This issuance is fully returned. The item stock has already been adjusted and will not be affected by this action.
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Moving to trash...
              </>
            ) : (
              "Move to Trash"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/features/core/components/button";
import { Input } from "@/features/core/components/input";
import { Plus, AlertTriangle } from "lucide-react";
import AllocationList from "./AllocationList";
import AllocationForm from "./AllocationForm";
import DeallocationDialog from "./DeallocationDialog";
import { Allocation, Room } from "../../types/hostel.types";
import { listAllocations, deleteAllocation } from "../../actions/allocation-actions";
import { listRooms } from "../../actions/room-actions";
import { Skeleton } from "@/features/core/components/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/features/core/components/dialog";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import type { ExportOptions } from "@/lib/export-utils";
import { ExportButton } from "@/features/components/export-button";

interface AllocationManagementProps {
  exportOptions?: ExportOptions | null;
  onExportOptionsChange?: (options: ExportOptions) => void;
}

export default function AllocationManagement({ exportOptions, onExportOptionsChange }: AllocationManagementProps) {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeallocateDialogOpen, setIsDeallocateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  console.log(allocations)

  // Load allocations and rooms
  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load allocations and rooms in parallel
      const [allocationsResult, roomsResult] = await Promise.all([
        listAllocations({ limit: 100 }), // Load all allocations for client-side pagination
        listRooms({ limit: 100 }), // Load all rooms
      ]);

      setAllocations(allocationsResult.allocations);
      setRooms(roomsResult.rooms);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to Load Data", {
        description: "Could not load allocations and rooms. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setIsFormOpen(true);
  };

  const handleDeallocate = (allocation: Allocation) => {
    setSelectedAllocation(allocation);
    setIsDeallocateDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    loadData(); // Reload data
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  const handleDeallocateSuccess = () => {
    setIsDeallocateDialogOpen(false);
    setSelectedAllocation(null);
    loadData(); // Reload data
  };

  const handleDeallocateClose = () => {
    setIsDeallocateDialogOpen(false);
    setSelectedAllocation(null);
  };

  const handleDelete = (allocation: Allocation) => {
    setSelectedAllocation(allocation);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAllocation) return;
    try {
      await deleteAllocation(selectedAllocation.id);
      toast.success("Allocation deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedAllocation(null);
      setDeleteConfirmText("");
      loadData();
    } catch (error) {
      toast.error("Failed to delete allocation", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  };

  const handleDeleteClose = () => {
    setIsDeleteDialogOpen(false);
    setSelectedAllocation(null);
    setDeleteConfirmText("");
  };

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col gap-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Filters Skeleton */}
        <div className="bg-muted rounded-lg p-4 border space-y-3">
          <Skeleton className="h-4 w-20" />
          <div className="flex flex-col md:flex-row gap-3 flex-wrap">
            <Skeleton className="h-10 w-full md:w-48" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="rounded-md border">
          <div className="space-y-0">
            {/* Header */}
            <div className="flex items-center gap-3 bg-muted border-b p-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            {/* Rows */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-b p-3 hover:bg-muted/50">
                <Skeleton className="h-4 w-4" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-40" />
                </div>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-6" />
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between py-2">
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 flex flex-col gap-6">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Student Allocations</h2>
            <p className="text-sm text-muted-foreground">
              Manage student bed allocations and deallocations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton
              options={exportOptions ?? { fileName: "allocations", columns: [], data: [] }}
              disabled={!exportOptions}
            />
            <Button onClick={handleAdd} size="sm" className="h-10 text-sm">
              <Plus className="mr-2 h-4 w-4" />
              Allocate Student
            </Button>
          </div>
        </div>

        {/* Allocations List */}
        <AllocationList
          allocations={allocations}
          onDeallocate={handleDeallocate}
          onDelete={handleDelete}
          onExportOptionsChange={onExportOptionsChange}
        />
      </div>

      {/* Allocation Form */}
      <AllocationForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        rooms={rooms}
      />

      {/* Deallocation Dialog */}
      <DeallocationDialog
        isOpen={isDeallocateDialogOpen}
        onClose={handleDeallocateClose}
        onSuccess={handleDeallocateSuccess}
        allocation={selectedAllocation}
      />

      {/* Delete Confirm Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={handleDeleteClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Allocation
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Warning */}
            <p className="text-sm text-muted-foreground">
              This action is <span className="font-semibold text-foreground">permanent and cannot be undone</span>. The following data will be deleted:
            </p>

            {/* What gets deleted */}
            {selectedAllocation && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student</span>
                  <span className="font-medium">{selectedAllocation.student?.fullname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room / Bed</span>
                  <span className="font-medium">
                    R{selectedAllocation.bed?.room?.roomNumber} / B{selectedAllocation.bed?.bedNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Allocated On</span>
                  <span className="font-medium">{formatNepaliDateFromDate(new Date(selectedAllocation.allocationDate))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Payments</span>
                  <span className="font-medium text-destructive">
                    {selectedAllocation.payments?.length ?? 0} payment record(s)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">{selectedAllocation.isActive ? "Active" : "Deallocated"}</span>
                </div>
              </div>
            )}

            {/* Confirmation input */}
            <div className="space-y-2">
              <p className="text-sm">
                Type <span className="font-mono font-semibold bg-muted px-1 py-0.5 rounded">{selectedAllocation?.student?.fullname}</span> to confirm deletion:
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={selectedAllocation?.student?.fullname}
                className="font-mono"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={handleDeleteClose}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteConfirmText !== selectedAllocation?.student?.fullname}
              >
                Delete Allocation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

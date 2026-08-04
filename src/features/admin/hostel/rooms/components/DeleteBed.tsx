import { AlertDialogFooter, AlertDialogHeader } from "@/features/core/components/alert-dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/features/core/components/alert-dialog";
import { DropdownMenuItem } from "@/features/core/components/dropdown-menu";
import { useState } from "react";
import { toast } from 'sonner'
import { Bed } from "../../types/hostel.types";
import { hostelApi } from '../api/hostel-api';

interface IDeleteBedProps {
    bed: Bed
    onUpdate: () => void
}

export default function DeleteBed({ onUpdate, bed }: IDeleteBedProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await hostelApi.beds.delete(bed.id)
            toast.success('Bed deleted successfully')
            setShowDeleteDialog(false)
            onUpdate()
        } catch (error) {
            console.error('Error deleting bed:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to delete bed')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
                <DropdownMenuItem
                    className="text-destructive"
                    onSelect={(e) => {
                        e.preventDefault()
                        setShowDeleteDialog(true)
                    }}
                >
                    Delete Bed
                </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete bed <strong>{bed.bedNumber}</strong>.
                        {bed.status === 'ALLOCATED' && (
                            <span className="block mt-2 text-destructive">
                                Warning: This bed is currently allocated. You must deallocate the student before deleting the bed.
                            </span>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={handleDelete}
                        disabled={isDeleting || bed.status === 'ALLOCATED'}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
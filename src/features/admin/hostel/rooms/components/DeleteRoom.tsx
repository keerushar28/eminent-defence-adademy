import { AlertDialogFooter, AlertDialogHeader } from "@/features/core/components/alert-dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/features/core/components/alert-dialog"; // Use consistent import path
import { DropdownMenuItem } from "@/features/core/components/dropdown-menu";
import { useState } from "react";
import { toast } from 'sonner'
import { Room } from "../../types/hostel.types";
import { hostelApi } from '../api/hostel-api';

interface IDeleteRoomProps {
    room: Room
    onUpdate: () => void
}

export default function DeleteRoom({ onUpdate, room }: IDeleteRoomProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const beds = room.beds || []

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await hostelApi.rooms.delete(room.id)
            toast.success('Room deleted successfully')
            setShowDeleteDialog(false)
            onUpdate()
        } catch (error) {
            console.error('Error deleting room:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to delete room')
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
                        e.preventDefault() // Prevent dropdown from closing
                        setShowDeleteDialog(true)
                    }}
                >
                    Delete Room
                </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete room <strong>{room.roomNumber}</strong>.
                        {beds.length > 0 && (
                            <span className="block mt-2 text-destructive">
                                Warning: This room has {beds.length} bed(s). You must remove all beds before deleting the room.
                            </span>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={handleDelete}
                        disabled={isDeleting || beds.length > 0}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
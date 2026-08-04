import {
    AlertDialog, AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/features/core/components/alert-dialog";
import { useStudent } from "../hooks/useStudent";
import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/features/core/components/input";
import { getStudentById } from "../actions/student-actions";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { createDeletionRequest } from "../actions/deletion-request-actions";

interface IDeleteProps {
    id: string;
}

export default function DeleteStudent({ id }: IDeleteProps) {
    const { handleDeleteStudent } = useStudent()
    const { data: session } = useSession()
    const [open, setOpen] = useState(false)
    const [studentName, setStudentName] = useState("")
    const [verificationInput, setVerificationInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const isStaff = session?.user?.role === "STAFF"

    // Load student name when dialog opens
    useEffect(() => {
        if (open && !studentName) {
            setIsLoading(true)
            getStudentById(id)
                .then(student => {
                    if (student) {
                        setStudentName(student.fullname)
                    }
                })
                .catch(error => {
                    console.error("Error fetching student:", error)
                })
                .finally(() => setIsLoading(false))
        }
    }, [open, id, studentName])

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            if (isStaff) {
                // Staff deletion - create a pending request
                const result = await createDeletionRequest(id, studentName)
                if (result.success) {
                    toast.info("Deletion request submitted", {
                        description: `Admin will review the deletion of ${studentName}`,
                        duration: 5000,
                    })
                } else {
                    toast.error(result.error || "Failed to submit deletion request")
                }
            } else {
                // Admin deletion - delete immediately
                await handleDeleteStudent(id)
            }
            setOpen(false)
            setVerificationInput("")
        } finally {
            setIsDeleting(false)
        }
    }

    const isVerified = verificationInput === `DELETE ${studentName}`

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <div className="flex items-center gap-2 w-full px-2 py-1.5 text-sm cursor-pointer rounded-sm hover:bg-accent text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Student</span>
                </div>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg">Delete Student</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">
                        This action cannot be undone. This will permanently delete this student and remove all allocations.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-4">
                    {isLoading ? (
                        <div className="text-sm text-muted-foreground">Loading student information...</div>
                    ) : (
                        <>
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                                <p className="text-sm font-medium text-destructive">
                                    Student: <span className="font-bold">{studentName}</span>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                    Verification Required
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Type <span className="font-mono font-bold">DELETE {studentName}</span> to confirm deletion
                                </p>
                                <Input
                                    type="text"
                                    placeholder={`Type: DELETE ${studentName}`}
                                    value={verificationInput}
                                    onChange={(e) => setVerificationInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        // Prevent dialog from capturing space key
                                        e.stopPropagation()
                                    }}
                                    disabled={isDeleting}
                                    className="w-full px-3 py-2 font-mono text-sm border border-input rounded-md bg-background"
                                    spellCheck={false}
                                    autoComplete="off"
                                />
                                {verificationInput && !isVerified && (
                                    <p className="text-xs text-destructive">
                                        ✗ Verification text does not match
                                    </p>
                                )}
                                {isVerified && (
                                    <p className="text-xs text-green-600">
                                        ✓ Verification confirmed
                                    </p>
                                )}
                            </div>

                            {isStaff && (
                                <div className="p-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
                                    <p className="font-semibold mb-1">⚠ Staff Action - Pending Approval</p>
                                    <p>This deletion request will be sent to admin for review and approval.</p>
                                </div>
                            )}

                            {!isStaff && (
                                <div className="p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-800 dark:text-blue-200">
                                    <p className="font-semibold mb-1">ℹ Admin Action</p>
                                    <p>This will permanently delete the student immediately.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting || isLoading || !isVerified}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? "Processing..." : isStaff ? "Request Deletion" : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
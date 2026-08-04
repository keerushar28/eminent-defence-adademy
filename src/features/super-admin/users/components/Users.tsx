"use client"
import { Skeleton } from "@/features/core/components/skeleton";
import { useUserManagement } from "../hooks/useUserManagement";
import { IUser } from "../types/types"
import ActionButtons from "./ActionButtons";
import { DataTable } from "./data-table"

interface IUsersProps {
    usersData?: IUser[]
}

export default function Users({ usersData }: IUsersProps) {
    const {
        currentUserId,
        isLoading,
        users,
        updateUserVerification,
        updateUserRole,
        deleteUser,
        hasChanges,
        discardChanges,
        getChangedUsers,
        isSaving,
        saveChanges,
    } = useUserManagement(usersData);

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center pb-2">
                <h1 className="text-2xl font-bold">User Management</h1>
                <ActionButtons
                    discardChanges={discardChanges}
                    hasChanges={hasChanges}
                    getChangedUsers={getChangedUsers}
                    isSaving={isSaving}
                    saveChanges={saveChanges}
                />
            </div>
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full bg-muted/50" />
                    ))}
                </div>
            ) : (
                <DataTable
                    users={users}
                    onVerificationChange={updateUserVerification}
                    currentUserId={currentUserId}
                    onRoleChange={updateUserRole}
                    onDeleteUser={deleteUser}
                />
            )}
        </div>
    );
}
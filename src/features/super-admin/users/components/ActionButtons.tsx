import { Button } from "@/features/core/components/button"
import { RefreshCw, Save } from "lucide-react"
import { IUser } from "../types/types";
import ClearDatabaseDialog from "../../components/ClearDatabaseDialog";


interface ActionButtonsProps {
    hasChanges: boolean;
    discardChanges: () => void;
    isSaving: boolean;
    saveChanges: () => Promise<void>;
    getChangedUsers: () => IUser[];
}

export default function ActionButtons({
    hasChanges,
    discardChanges,
    isSaving,
    saveChanges,
    getChangedUsers
}: ActionButtonsProps) {
    return <div className="flex gap-2">
        <ClearDatabaseDialog />
        {hasChanges && (
            <>
                <Button
                    onClick={discardChanges}
                    variant="outline"
                    disabled={isSaving}
                >
                    Discard Changes
                </Button>
                <Button
                    onClick={saveChanges}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700"
                >
                    {isSaving ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Changes ({getChangedUsers().length})
                </Button>
            </>
        )}
    </div>
}
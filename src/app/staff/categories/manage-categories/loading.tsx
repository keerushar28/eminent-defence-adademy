// app/admin/categories/loading.tsx
import { Loader2 } from "lucide-react"

export default function Loading() {
    return (
        <div className="container mx-auto py-4">
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading categories...</span>
            </div>
        </div>
    )
}
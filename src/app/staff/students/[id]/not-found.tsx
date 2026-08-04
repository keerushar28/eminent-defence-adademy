import { Button } from "@/features/core/components/button"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function StudentNotFound() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Student Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The student you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/admin/students">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Link>
        </Button>
      </div>
    </div>
  )
}
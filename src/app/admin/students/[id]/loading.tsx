import { Loader2 } from "lucide-react"

export default function StudentDetailLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading student information...</span>
      </div>
    </div>
  )
}
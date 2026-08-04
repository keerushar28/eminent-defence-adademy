export const dynamic = "force-dynamic"

import CategoryAssignmentsDataTable from "@/features/admin/students/components/CategoryAssignmentsDataTable"
import { getStudents } from "@/features/admin/students/actions/student-actions"
import { getCategories } from "@/features/admin/categories/actions/category-actions"

export default async function CategoryAssignmentsPage() {
    const allStudents = await getStudents()
    const categoriesResult = await getCategories()
    
    // Filter to show only students with active assigned categories in the datatable
    const studentsWithCategories = allStudents.filter(
        student => student.studentCategories && student.studentCategories.some(sc => sc.isActive)
    )

    const categories = categoriesResult.success ? categoriesResult.data || [] : []

    return (
        <div className="p-4 flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold">Category Assignments</h1>
                    <p className="text-muted-foreground">
                        Assign categories to students and manage payments
                    </p>
                </div>
            </div>


            {/* Data Table */}
            <CategoryAssignmentsDataTable
                students={studentsWithCategories}
                allStudents={allStudents}
                categories={categories}
            />
        </div>
    )
}

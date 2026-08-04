export const dynamic = 'force-dynamic'; // Add this line

import CategoriesDataTable from "@/features/admin/categories/components/CategoriesDataTable"
import { getCategories } from "@/features/admin/categories/actions/category-actions"

export default async function CategoriesPage() {
  const categories = await getCategories()

  if (categories.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Error: {categories.error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4">
      <CategoriesDataTable categories={categories.data} />
    </div>
  )
}
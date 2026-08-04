import { useState, useEffect, useMemo } from "react"

interface SubCategory {
  id: string
  name: string
  categoryId: string
}

interface Category {
  id: string
  name: string
}

export function useSubCategoryFilter(
  allSubCategories: SubCategory[],
  selectedCategory: string,
  categories?: Category[]
) {
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all")

  // Get the selected category ID for filtering sub categories
  const selectedCategoryId = useMemo(() => {
    if (selectedCategory === "all" || selectedCategory === "ALL") return null
    // Find the category ID by matching the category name
    const category = categories?.find(c => c.name === selectedCategory)
    return category?.id || null
  }, [selectedCategory, categories])

  // Filter sub categories by selected category
  const filteredSubCategories = useMemo(() => {
    if (selectedCategory === "all" || selectedCategory === "ALL") {
      return allSubCategories
    }
    return allSubCategories.filter(sc => sc.categoryId === selectedCategoryId)
  }, [allSubCategories, selectedCategory, selectedCategoryId])

  // Reset sub category when main category changes
  useEffect(() => {
    if (selectedCategory === "all") {
      setSelectedSubCategory("all")
    } else if (
      selectedSubCategory !== "all" &&
      !filteredSubCategories.some(sc => sc.name === selectedSubCategory)
    ) {
      setSelectedSubCategory("all")
    }
  }, [selectedCategory, filteredSubCategories, selectedSubCategory])

  return {
    selectedSubCategory,
    setSelectedSubCategory,
    filteredSubCategories,
  }
}

'use client'

import { useState, useEffect, useMemo } from "react"
import { Badge } from "@/features/core/components/badge"
import { Checkbox } from "@/features/core/components/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/features/core/components/card"
import { ChevronDown, ChevronRight, Users } from "lucide-react"
import { ICategory } from "../types/types"
import {
  Collapsible, CollapsibleContent,
  CollapsibleTrigger
} from "@/features/core/components/collapsible"
import { Label } from "@/features/core/components/label"

interface StudentCategorySelectorProps {
  categories: ICategory[]
  selectedSubCategoryIds: string[]
  onSelectionChange: (subCategoryIds: string[]) => void
  disabled?: boolean
}

export default function StudentCategorySelector({
  categories,
  selectedSubCategoryIds,
  onSelectionChange,
  disabled = false
}: StudentCategorySelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Auto-expand categories that have selected subcategories
  useEffect(() => {
    const categoriesToExpand = new Set<string>()
    categories.forEach(category => {
      if (category.subCategories?.some(sub => selectedSubCategoryIds.includes(sub.id))) {
        categoriesToExpand.add(category.id)
      }
    })

    // Only update if the set has actually changed
    setExpandedCategories(prev => {
      if (prev.size !== categoriesToExpand.size) {
        return categoriesToExpand
      }

      // Check if all items are the same
      for (const item of categoriesToExpand) {
        if (!prev.has(item)) {
          return categoriesToExpand
        }
      }

      // No change needed
      return prev
    })
  }, [categories, selectedSubCategoryIds])

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleSubCategoryToggle = (subCategoryId: string) => {
    if (disabled) return

    const newSelection = selectedSubCategoryIds.includes(subCategoryId)
      ? selectedSubCategoryIds.filter(id => id !== subCategoryId)
      : [...selectedSubCategoryIds, subCategoryId]

    onSelectionChange(newSelection)
  }

  const totalFee = useMemo(() => {
    let total = 0
    categories.forEach(category => {
      category.subCategories?.forEach(sub => {
        if (selectedSubCategoryIds.includes(sub.id)) {
          total += Number(sub.fee)
        }
      })
    })
    return total
  }, [categories, selectedSubCategoryIds])

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Users className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No categories available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Assign Categories</Label>
        {selectedSubCategoryIds.length > 0 && (
          <div className="text-right">
            <Badge variant="secondary" className="mb-1">
              {selectedSubCategoryIds.length} selected
            </Badge>
            <p className="text-sm font-medium">
              Total Fee: NPR {totalFee.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {categories.map((category) => {
          const isExpanded = expandedCategories.has(category.id)
          const selectedInCategory = category.subCategories?.filter(sub =>
            selectedSubCategoryIds.includes(sub.id)
          ).length || 0

          return (
            <Card key={category.id} className="overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer  transition-colors pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <div>
                          <CardTitle className="text-base">{category.name}</CardTitle>
                          {category.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedInCategory > 0 && (
                          <Badge variant="default" className="text-xs">
                            {selectedInCategory} selected
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {category.subCategories?.length || 0} subcategories
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {category.subCategories && category.subCategories.length > 0 ? (
                      <div className="space-y-3">
                        {category.subCategories.map((subCategory) => {
                          const isSelected = selectedSubCategoryIds.includes(subCategory.id)

                          return (
                            <div
                              key={subCategory.id}
                              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isSelected
                                ? 'bg-primary/5 border-primary/20'
                                : 'bg-background border-border hover:bg-muted/50'
                                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => !disabled && handleSubCategoryToggle(subCategory.id)}
                                  disabled={disabled}
                                />
                                <div>
                                  <p className="font-medium text-sm">{subCategory.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Fee: NPR {Number(subCategory.fee).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <Badge variant="default" className="text-xs">
                                  Selected
                                </Badge>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No subcategories in this category
                      </p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )
        })}
      </div>

      {selectedSubCategoryIds.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <h4 className="font-medium mb-2">Selected Subcategories:</h4>
            <div className="flex flex-wrap gap-2">
              {categories.map(category =>
                category.subCategories
                  ?.filter(sub => selectedSubCategoryIds.includes(sub.id))
                  .map(sub => (
                    <Badge key={sub.id} variant="secondary" className="text-xs">
                      {category.name} - {sub.name} (NPR {Number(sub.fee).toLocaleString()})
                    </Badge>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
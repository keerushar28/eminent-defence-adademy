'use client'

import { useState, useEffect } from "react"
import { Badge } from "@/features/core/components/badge"
import { Input } from "@/features/core/components/input"
import { Card, CardContent } from "@/features/core/components/card"
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Users } from "lucide-react"
import { Checkbox } from "@/features/core/components/checkbox"
import {
    Collapsible, CollapsibleContent,
    CollapsibleTrigger
} from "@/features/core/components/collapsible"
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/features/core/components/tooltip"
import { useCategoryAssignment } from "@/features/admin/students/hooks/useCategoryAssignment"
import { Label } from "@/features/core/components/label"

interface CategoryAssignmentListProps {
    assignHook: ReturnType<typeof useCategoryAssignment>
    alreadyAssignedSubCategoryIds?: Set<string>
    isSubmitting?: boolean
    isLoadingAssignments?: boolean
    /** When true, already-assigned categories can be unchecked (for EditStudent) */
    editMode?: boolean
}

export function CategoryAssignmentList({
    assignHook,
    alreadyAssignedSubCategoryIds = new Set(),
    isSubmitting = false,
    isLoadingAssignments = false,
    editMode = false
}: CategoryAssignmentListProps) {
    const {
        categories,
        selectedSubCategoryIds,
        discounts,
        assignedDates,
        durations,
        notes,
        handleSubCategoryToggle,
        handleDiscountChange,
        handleDateChange,
        handleDurationChange,
        handleNotesChange,
        validationResults
    } = assignHook

    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

    // Auto-expand categories that have selected subcategories
    useEffect(() => {
        const categoriesToExpand = new Set<string>()
        categories.forEach(category => {
            if (category.subCategories?.some(sub => selectedSubCategoryIds.includes(sub.id))) {
                categoriesToExpand.add(category.id)
            }
        })
        setExpandedCategories(prev => {
            if (prev.size !== categoriesToExpand.size) {
                return categoriesToExpand
            }
            for (const item of categoriesToExpand) {
                if (!prev.has(item)) {
                    return categoriesToExpand
                }
            }
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

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Category Assignment</Label>
                {selectedSubCategoryIds.length > 0 && (
                    <Badge variant="secondary">
                        {selectedSubCategoryIds.length} selected
                    </Badge>
                )}
            </div>
            {categories.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <Users className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No categories available</p>
                    </CardContent>
                </Card>
            ) : (
                <TooltipProvider>
                    <div className="space-y-3">
                        {categories.map((category) => {
                            const isExpanded = expandedCategories.has(category.id)
                            const selectedInCategory = category.subCategories?.filter(sub =>
                                selectedSubCategoryIds.includes(sub.id)
                            ).length || 0

                            return (
                                <Card key={category.id} className="overflow-hidden shadow-xs">
                                    <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
                                        <CollapsibleTrigger asChild>
                                            <div className="cursor-pointer transition-colors p-4 hover:bg-muted/50">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                        )}
                                                        <div>
                                                            <h3 className="font-semibold text-base">{category.name}</h3>
                                                            {category.description && (
                                                                <p className="text-sm text-muted-foreground mt-0.5">
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
                                            </div>
                                        </CollapsibleTrigger>

                                        <CollapsibleContent>
                                            <div className="px-4 pb-4">
                                                {category.subCategories && category.subCategories.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {category.subCategories.map((subCategory) => {
                                                            const isSelected = selectedSubCategoryIds.includes(subCategory.id)
                                                            const isAlreadyAssigned = alreadyAssignedSubCategoryIds.has(subCategory.id)
                                                            const validation = validationResults.find(v => v.subCategoryId === subCategory.id)
                                                            const discountValue = discounts[subCategory.id] || ""
                                                            const originalFee = Number(subCategory.fee)

                                                            return (
                                                                <Tooltip key={subCategory.id}>
                                                                    <TooltipTrigger asChild>
                                                                <div
                                                                    className={`p-4 rounded-lg border transition-all ${isAlreadyAssigned && !editMode
                                                                        ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                                                                        : isSelected
                                                                            ? 'bg-primary/5 border-primary/30'
                                                                            : 'bg-background border-border hover:bg-muted/30'
                                                                        } ${isSubmitting || isLoadingAssignments || (isAlreadyAssigned && !editMode) ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                                >
                                                                    {/* Checkbox and Category Info */}
                                                                    <div className="flex items-start gap-3 mb-3">
                                                                        <Checkbox
                                                                            checked={isSelected}
                                                                            onCheckedChange={() => !isSubmitting && !isLoadingAssignments && handleSubCategoryToggle(subCategory.id)}
                                                                            disabled={isSubmitting || isLoadingAssignments || (isAlreadyAssigned && !editMode)}
                                                                            className="mt-1"
                                                                        />
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-start justify-between">
                                                                                        <div>
                                                                                            <p className="font-medium text-sm">{subCategory.name}</p>
                                                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                                                Original Fee: <span className="font-medium text-foreground">NPR {originalFee.toLocaleString()}</span>
                                                                                            </p>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2 ml-2">
                                                                                            {isAlreadyAssigned && (
                                                                                                <Badge variant="secondary" className={`text-xs flex items-center gap-1 ${editMode
                                                                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                                                }`}>
                                                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                                                    {editMode ? "Currently Assigned" : "Already Assigned"}
                                                                                                </Badge>
                                                                                            )}
                                                                                            {isSelected && !isAlreadyAssigned && (
                                                                                                <Badge variant="default" className="text-xs">
                                                                                                    Selected
                                                                                                </Badge>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Additional Fields - Only show when selected */}
                                                                            {isSelected && (
                                                                                <div className="ml-7 space-y-3 pt-3 border-t">
                                                                                    <div className="grid grid-cols-2 gap-3">
                                                                                        <div>
                                                                                            <label className="text-xs font-medium block mb-1.5">
                                                                                                Assigned Date
                                                                                            </label>
                                                                                            <NepaliDatePicker
                                                                                                value={assignedDates[subCategory.id]}
                                                                                                onChange={(date) => handleDateChange(subCategory.id, date)}
                                                                                                placeholder="Select date"
                                                                                                className="w-full"
                                                                                            />
                                                                                        </div>

                                                                                        <div>
                                                                                            <label className="text-xs font-medium block mb-1.5">
                                                                                                Duration (Months)
                                                                                            </label>
                                                                                            <Input
                                                                                                type="text"
                                                                                                placeholder="e.g., 6 (optional)"
                                                                                                value={durations[subCategory.id] || ""}
                                                                                                onChange={(e) => handleDurationChange(subCategory.id, e.target.value)}
                                                                                                disabled={isSubmitting}
                                                                                                className="h-9 text-sm bg-white"
                                                                                            />
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="grid grid-cols-2 gap-3">
                                                                                        <div>
                                                                                            <label className="text-xs font-medium block mb-1.5">
                                                                                                Discount (NPR)
                                                                                            </label>
                                                                                            <Input
                                                                                                type="text"
                                                                                                placeholder="Enter discount"
                                                                                                value={discountValue}
                                                                                                onChange={(e) => handleDiscountChange(subCategory.id, e.target.value)}
                                                                                                disabled={isSubmitting}
                                                                                                className={`h-9 text-sm bg-white ${!validation?.isValid && discountValue !== "" ? 'border-destructive' : ''}`}
                                                                                            />
                                                                                            {validation && !validation.isValid && discountValue !== "" && (
                                                                                                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                                                                                                    <AlertCircle className="h-3 w-3" />
                                                                                                    {validation.error}
                                                                                                </p>
                                                                                            )}
                                                                                        </div>

                                                                                        <div>
                                                                                            <label className="text-xs font-medium block mb-1.5">
                                                                                                Final Fee
                                                                                            </label>
                                                                                            <div className={`h-9 flex items-center px-3 rounded-md border-2 font-semibold text-sm transition-colors ${validation?.discount && validation.discount > 0
                                                                                                ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-950 dark:border-green-700 dark:text-green-300'
                                                                                                : 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-300'
                                                                                                }`}>
                                                                                                {validation && validation.isValid ? (
                                                                                                    <span>NPR {validation.finalFee.toLocaleString()}</span>
                                                                                                ) : (
                                                                                                    <span>NPR {originalFee.toLocaleString()}</span>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    <div>
                                                                                        <label className="text-xs font-medium block mb-1.5">
                                                                                            Notes (Optional)
                                                                                        </label>
                                                                                        <Input
                                                                                            type="text"
                                                                                            placeholder="Add any notes for this assignment..."
                                                                                            value={notes[subCategory.id] || ""}
                                                                                            onChange={(e) => handleNotesChange(subCategory.id, e.target.value)}
                                                                                            disabled={isSubmitting}
                                                                                            className="h-9 text-sm bg-white"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    {isAlreadyAssigned && (
                                                                        <TooltipContent>
                                                                            <p>{editMode
                                                                                ? "Uncheck to remove this category from the student"
                                                                                : "This student is already assigned to this category"
                                                                            }</p>
                                                                        </TooltipContent>
                                                                    )}
                                                                </Tooltip>
                                                            )
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground py-4 text-center">
                                                        No subcategories in this category
                                                    </p>
                                                )}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </Card>
                            )
                        })}
                    </div>
                </TooltipProvider>
            )}
        </div>
    )
}

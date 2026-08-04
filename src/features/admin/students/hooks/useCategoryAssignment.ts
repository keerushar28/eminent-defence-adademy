import { useState, useMemo, useEffect, useCallback } from "react"
import { useCategories } from "@/features/admin/categories/hooks/useCategories"

export interface AssignmentData {
  subCategoryId: string
  discountAmount: number
  assignedDate?: Date | undefined
  durationMonths?: number
  notes?: string
}

export interface DiscountMap {
  [subCategoryId: string]: string
}

export interface DateMap {
  [subCategoryId: string]: Date | undefined
}

export interface DurationMap {
  [subCategoryId: string]: string
}

export interface NotesMap {
  [subCategoryId: string]: string
}

export interface UseCategoryAssignmentProps {
  initialAssignments?: AssignmentData[]
  // Callback to parent when validity changes or totals change
  onStateChange?: (isValid: boolean, totals: { original: number, discount: number, final: number }, assignments: AssignmentData[]) => void
}

export function useCategoryAssignment({ initialAssignments = [], onStateChange }: UseCategoryAssignmentProps = {}) {
  const { categories } = useCategories()
  
  // Track selected subcategories
  const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState<string[]>(() => {
    return initialAssignments.map(a => a.subCategoryId)
  })

  // Track discount amounts for each subcategory
  const [discounts, setDiscounts] = useState<DiscountMap>(() => {
    const map: DiscountMap = {}
    initialAssignments.forEach(assignment => {
      map[assignment.subCategoryId] = assignment.discountAmount > 0 ? assignment.discountAmount.toString() : ""
    })
    return map
  })

  // Track assigned dates for each subcategory
  const [assignedDates, setAssignedDates] = useState<DateMap>(() => {
    const map: DateMap = {}
    initialAssignments.forEach(assignment => {
      map[assignment.subCategoryId] = assignment.assignedDate ? new Date(assignment.assignedDate) : new Date()
    })
    return map
  })

  // Track duration in months for each subcategory
  const [durations, setDurations] = useState<DurationMap>(() => {
    const map: DurationMap = {}
    initialAssignments.forEach(assignment => {
      map[assignment.subCategoryId] = assignment.durationMonths ? assignment.durationMonths.toString() : ""
    })
    return map
  })

  // Track notes for each subcategory
  const [notes, setNotes] = useState<NotesMap>(() => {
      const map: NotesMap = {}
      initialAssignments.forEach(assignment => {
          if (assignment.notes) map[assignment.subCategoryId] = assignment.notes
      })
      return map
  })

  // Initialize empty fields for newly selected subcategories
  useEffect(() => {
    setDiscounts(prev => {
      const updated = { ...prev }
      selectedSubCategoryIds.forEach(id => {
        if (!(id in updated)) updated[id] = ""
      })
      return updated
    })
    setAssignedDates(prev => {
      const updated = { ...prev }
      selectedSubCategoryIds.forEach(id => {
        if (!(id in updated)) updated[id] = new Date()
      })
      return updated
    })
    setDurations(prev => {
      const updated = { ...prev }
      selectedSubCategoryIds.forEach(id => {
        if (!(id in updated)) updated[id] = ""
      })
      return updated
    })
    setNotes(prev => {
      const updated = { ...prev }
      selectedSubCategoryIds.forEach(id => {
        if (!(id in updated)) updated[id] = ""
      })
      return updated
    })
  }, [selectedSubCategoryIds])

  const handleSubCategoryToggle = useCallback((subCategoryId: string) => {
    setSelectedSubCategoryIds((prev) => {
      const newSelection = prev.includes(subCategoryId)
        ? prev.filter(id => id !== subCategoryId)
        : [...prev, subCategoryId]
      return newSelection
    })
  }, [])

  const handleDiscountChange = useCallback((subCategoryId: string, value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setDiscounts(prev => ({ ...prev, [subCategoryId]: value }))
    }
  }, [])

  const handleDateChange = useCallback((subCategoryId: string, date: Date | { from?: Date; to?: Date } | undefined) => {
    const dateValue = date instanceof Date ? date : (date?.from || undefined)
    setAssignedDates(prev => ({ ...prev, [subCategoryId]: dateValue }))
  }, [])

  const handleDurationChange = useCallback((subCategoryId: string, value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      setDurations(prev => ({ ...prev, [subCategoryId]: value }))
    }
  }, [])

  const handleNotesChange = useCallback((subCategoryId: string, value: string) => {
    setNotes(prev => ({ ...prev, [subCategoryId]: value }))
  }, [])

  const validationResults = useMemo(() => {
    const results: Array<{
      subCategoryId: string
      originalFee: number
      discount: number
      finalFee: number
      isValid: boolean
      error?: string
    }> = []

    selectedSubCategoryIds.forEach((subCategoryId) => {
      const subCategory = categories
        .flatMap(c => c.subCategories || [])
        .find(sc => sc.id === subCategoryId)

      if (!subCategory) return

      const originalFee = Number(subCategory.fee)
      const discountStr = (discounts[subCategoryId] || "").trim()

      if (discountStr === "") {
        results.push({ subCategoryId, originalFee, discount: 0, finalFee: originalFee, isValid: true })
        return
      }

      const discount = parseFloat(discountStr)

      if (isNaN(discount)) {
        results.push({ subCategoryId, originalFee, discount: 0, finalFee: originalFee, isValid: false, error: "Invalid discount" })
        return
      }

      if (discount < 0) {
        results.push({ subCategoryId, originalFee, discount: 0, finalFee: originalFee, isValid: false, error: "Cannot be negative" })
        return
      }

      if (discount > originalFee) {
        results.push({ subCategoryId, originalFee, discount, finalFee: 0, isValid: false, error: "Exceeds original fee" })
        return
      }

      const finalFee = originalFee - discount
      results.push({ subCategoryId, originalFee, discount, finalFee, isValid: true })
    })

    return results
  }, [selectedSubCategoryIds, discounts, categories])

  const totalOriginalFee = validationResults.reduce((sum, r) => sum + r.originalFee, 0)
  const totalDiscount = validationResults.reduce((sum, r) => sum + r.discount, 0)
  const totalFinalFee = validationResults.reduce((sum, r) => sum + r.finalFee, 0)
  const isFormValid = validationResults.every(r => r.isValid) && (selectedSubCategoryIds.length === 0 || validationResults.length > 0)

  // Notify parent of changes
  useEffect(() => {
     if (onStateChange) {
         const assignments = validationResults.map(r => ({
             subCategoryId: r.subCategoryId,
             discountAmount: r.discount,
             assignedDate: assignedDates[r.subCategoryId],
             durationMonths: durations[r.subCategoryId] ? parseInt(durations[r.subCategoryId]) : undefined,
             notes: notes[r.subCategoryId] || undefined
         }))
         onStateChange(isFormValid, { original: totalOriginalFee, discount: totalDiscount, final: totalFinalFee }, assignments)
     }
  }, [validationResults, assignedDates, durations, notes, isFormValid, onStateChange, totalOriginalFee, totalDiscount, totalFinalFee])

  const resetForm = useCallback(() => {
    setSelectedSubCategoryIds([])
    setDiscounts({})
    setAssignedDates({})
    setDurations({})
    setNotes({})
  }, [])

  const setAssignments = useCallback((assignments: AssignmentData[]) => {
      const newSelectedSubCategoryIds = assignments.map(a => a.subCategoryId)
      
      const newDiscounts: DiscountMap = {}
      const newAssignedDates: DateMap = {}
      const newDurations: DurationMap = {}
      const newNotes: NotesMap = {}
      
      assignments.forEach(a => {
          newDiscounts[a.subCategoryId] = a.discountAmount > 0 ? a.discountAmount.toString() : ""
          newAssignedDates[a.subCategoryId] = a.assignedDate
          newDurations[a.subCategoryId] = a.durationMonths ? a.durationMonths.toString() : ""
          if (a.notes) newNotes[a.subCategoryId] = a.notes
      })
      
      setSelectedSubCategoryIds(newSelectedSubCategoryIds)
      setDiscounts(newDiscounts)
      setAssignedDates(newAssignedDates)
      setDurations(newDurations)
      setNotes(newNotes)
  }, [])

  return {
    categories,
    selectedSubCategoryIds,
    setSelectedSubCategoryIds,
    setAssignments,
    discounts,
    assignedDates,
    durations,
    notes,
    handleSubCategoryToggle,
    handleDiscountChange,
    handleDateChange,
    handleDurationChange,
    handleNotesChange,
    validationResults,
    isFormValid,
    totalOriginalFee,
    totalDiscount,
    totalFinalFee,
    resetForm
  }
}

import { useState, useEffect, useCallback } from "react"
import { getStudentCategoryAssignments } from "../actions/category-assignment-actions"

export interface ExistingAssignment {
  subCategoryId: string
  discountAmount: number
  assignedDate?: Date
  durationMonths?: number
  notes?: string
}

interface UseExistingAssignmentsOptions {
  studentId?: string
  /** If provided, will be used instead of fetching from server */
  studentCategories?: Array<{
    subCategoryId?: string
    subCategory?: { id: string }
    discountAmount?: number | string
    assignedDate?: Date | string
    durationMonths?: number
    notes?: string
    isActive?: boolean
  }>
}

interface UseExistingAssignmentsReturn {
  existingAssignments: ExistingAssignment[]
  alreadyAssignedSubCategoryIds: Set<string>
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Custom hook to fetch and manage existing category assignments for a student.
 * Can be used in both EditStudent and CategoryAssignmentsDataTable components.
 */
export function useExistingAssignments({
  studentId,
  studentCategories
}: UseExistingAssignmentsOptions = {}): UseExistingAssignmentsReturn {
  const [existingAssignments, setExistingAssignments] = useState<ExistingAssignment[]>([])
  const [alreadyAssignedSubCategoryIds, setAlreadyAssignedSubCategoryIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Map student categories to ExistingAssignment format
  const mapToExistingAssignments = useCallback((categories: NonNullable<UseExistingAssignmentsOptions['studentCategories']>): ExistingAssignment[] => {
    return categories
      .filter(sc => sc.isActive !== false) // Include if isActive is true or undefined
      .map(sc => ({
        subCategoryId: sc.subCategoryId || sc.subCategory?.id || "",
        discountAmount: typeof sc.discountAmount === 'string' ? parseFloat(sc.discountAmount) : Number(sc.discountAmount || 0),
        assignedDate: sc.assignedDate ? new Date(sc.assignedDate) : undefined,
        durationMonths: sc.durationMonths ?? undefined,
        notes: sc.notes || undefined
      }))
      .filter(a => a.subCategoryId) // Filter out any with empty subCategoryId
  }, [])

  // Fetch assignments from server
  const fetchAssignments = useCallback(async () => {
    if (!studentId) {
      setExistingAssignments([])
      setAlreadyAssignedSubCategoryIds(new Set())
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const assignments = await getStudentCategoryAssignments(studentId)
      
      const activeAssignments = assignments.filter(a => a.isActive)
      
      const mapped = activeAssignments.map(a => ({
        subCategoryId: a.subCategory?.id || "",
        discountAmount: typeof a.discountAmount === 'string' ? parseFloat(a.discountAmount) : Number(a.discountAmount || 0),
        assignedDate: a.assignedDate ? new Date(a.assignedDate) : undefined,
        durationMonths: a.durationMonths ?? undefined,
        notes: a.notes || undefined
      })).filter(a => a.subCategoryId)

      setExistingAssignments(mapped)
      
      const activeIds = new Set(
        activeAssignments
          .map(a => a.subCategory?.id)
          .filter(Boolean) as string[]
      )
      setAlreadyAssignedSubCategoryIds(activeIds)
    } catch (err) {
      console.error("Error fetching assignments:", err)
      setError("Failed to fetch category assignments")
      setExistingAssignments([])
      setAlreadyAssignedSubCategoryIds(new Set())
    } finally {
      setIsLoading(false)
    }
  }, [studentId])

  // Effect to handle studentCategories prop (for EditStudent where data is already loaded)
  useEffect(() => {
    if (studentCategories) {
      const mapped = mapToExistingAssignments(studentCategories)
      setExistingAssignments(mapped)
      
      const activeIds = new Set(mapped.map(a => a.subCategoryId))
      setAlreadyAssignedSubCategoryIds(activeIds)
    }
  }, [studentCategories, mapToExistingAssignments])

  // Effect to fetch from server when studentId changes (and no studentCategories provided)
  useEffect(() => {
    if (studentId && !studentCategories) {
      fetchAssignments()
    }
  }, [studentId, studentCategories, fetchAssignments])

  return {
    existingAssignments,
    alreadyAssignedSubCategoryIds,
    isLoading,
    error,
    refetch: fetchAssignments
  }
}

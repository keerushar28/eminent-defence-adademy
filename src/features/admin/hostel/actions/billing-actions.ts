'use server'

import {
  BillingInfo,
  StudentFinancialView,
  DeallocationWarning,
} from '../types/hostel.types'
import {
  calculateTotalPayableDays,
  calculatePendingDays,
  calculatePendingAmount,
  calculateOverpaidAmount,
} from '../lib/calculations'
import { getEffectivePrice } from './bed-actions'
import { prisma } from '@/features/core/lib/prisma'


/**
 * Calculate billing information for an allocation
 * Uses calculation utility functions to compute all billing metrics
 * Uses bed-specific price or room default price for calculations
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 * 
 * @param allocationId - ID of the allocation
 * @param currentDate - Optional current date for calculation (defaults to now)
 * @returns BillingInfo object with all billing calculations
 * @throws Error if allocation not found
 */
export async function calculateBilling(
  allocationId: string,
  currentDate: Date = new Date()
): Promise<BillingInfo> {
  try {
    // Get allocation with related data
    const allocation = await prisma.hostelAllocation.findUnique({
      where: { id: allocationId },
      include: {
        student: true,
        bed: {
          include: {
            room: true,
          },
        },
        payments: true,
      },
    })

    if (!allocation) {
      throw new Error(`Allocation with ID ${allocationId} not found`)
    }

    // Get effective price (bed-specific or room default)
    const pricePerDay = await getEffectivePrice(allocation.bedId)

    // Calculate total paid (sum of all payments)
    const totalPaid = allocation.payments.reduce((sum, payment) => sum + payment.amount.toNumber(), 0)

    // Calculate billing metrics using utility functions
    const totalPayableDays = calculateTotalPayableDays(
      allocation.allocationDate,
      currentDate
    )
    const pendingDays = calculatePendingDays(allocation.paidUntil, currentDate, allocation.allocationDate)
    const pendingAmount = calculatePendingAmount(pendingDays, pricePerDay)
    
    // Calculate overpaid amount based on actual payments vs consumed days
    const creditAmount = calculateOverpaidAmount(
      allocation.allocationDate,
      currentDate,
      totalPaid,
      pricePerDay
    )
    const overpaidDays = pricePerDay > 0 ? Math.floor(creditAmount / pricePerDay) : 0

    // Build billing info object
    const billingInfo: BillingInfo = {
      allocationId: allocation.id,
      studentId: allocation.studentId,
      studentName: allocation.student.fullname || 'Unknown',
      roomNumber: allocation.bed.room.roomNumber,
      bedNumber: allocation.bed.bedNumber,
      allocationDate: allocation.allocationDate,
      deallocationDate: allocation.deallocationDate || undefined,
      paidUntil: allocation.paidUntil,
      pricePerDay,
      totalPayableDays,
      pendingDays,
      pendingAmount,
      overpaidDays,
      creditAmount,
      isActive: allocation.isActive,
    }

    return billingInfo
  } catch (error) {
    console.error('Error calculating billing:', error)
    throw error
  }
}

/**
 * Get all pending fees across all students
 * Retrieves all allocations with pending fees including deallocated allocations
 * Calculates billing information for each allocation
 * 
 * Requirements: 7.2, 7.4, 7.8
 * 
 * @param includeInactive - Whether to include deallocated allocations (defaults to true)
 * @returns Array of BillingInfo for allocations with pending fees
 */
export async function getAllPendingFees(params: {
  includeInactive?: boolean
} = {}): Promise<BillingInfo[]> {
  try {
    const { includeInactive = true } = params
    const currentDate = new Date()

    // Build where clause
    const where: Record<string, unknown> = {}
    if (!includeInactive) {
      where.isActive = true
    }

    // Get all allocations
    const allocations = await prisma.hostelAllocation.findMany({
      where,
      include: {
        student: true,
        bed: {
          include: {
            room: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { allocationDate: 'desc' },
      ],
    })

    // Calculate billing for each allocation and filter for pending fees
    const pendingFees: BillingInfo[] = []

    for (const allocation of allocations) {
      const billingInfo = await calculateBilling(allocation.id, currentDate)
      
      // Only include allocations with pending amount > 0
      if (billingInfo.pendingAmount > 0) {
        pendingFees.push(billingInfo)
      }
    }

    return pendingFees
  } catch (error) {
    console.error('Error getting all pending fees:', error)
    throw error
  }
}

/**
 * Get complete financial view for a student
 * Retrieves all allocations for a student (active and inactive)
 * Calculates total pending fees, total credits, and final balance
 * Includes all payment records
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7
 * 
 * @param studentId - ID of the student
 * @returns StudentFinancialView with all allocations and financial summary
 */
export async function getStudentFinancialView(
  studentId: string
): Promise<StudentFinancialView> {
  try {
    const currentDate = new Date()

    // Get all allocations for the student (active and inactive)
    const allocations = await prisma.hostelAllocation.findMany({
      where: { studentId },
      include: {
        student: true,
        bed: {
          include: {
            room: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { allocationDate: 'desc' },
      ],
    })

    // Calculate billing for each allocation
    const billingInfos: BillingInfo[] = []
    let totalPending = 0
    let totalCredit = 0

    for (const allocation of allocations) {
      const billingInfo = await calculateBilling(allocation.id, currentDate)
      billingInfos.push(billingInfo)
      
      // Accumulate totals
      totalPending += billingInfo.pendingAmount
      totalCredit += billingInfo.creditAmount
    }

    // Calculate final balance (pending - credit)
    const finalBalance = totalPending - totalCredit

    return {
      allocations: billingInfos,
      totalPending,
      totalCredit,
      finalBalance,
    }
  } catch (error) {
    console.error('Error getting student financial view:', error)
    throw error
  }
}

/**
 * Check for pending fees before deallocation
 * Calculate pending fees for an allocation using calculation utilities
 * Return warning object with pending amount if greater than zero
 * 
 * Requirements: 6.3, 6.4
 * 
 * @param allocationId - ID of the allocation
 * @returns DeallocationWarning object
 * @throws Error if allocation not found
 */
export async function checkDeallocationWarning(
  allocationId: string
): Promise<DeallocationWarning> {
  try {
    const currentDate = new Date()

    // Get allocation
    const allocation = await prisma.hostelAllocation.findUnique({
      where: { id: allocationId },
      include: {
        bed: {
          include: {
            room: true,
          },
        },
      },
    })

    if (!allocation) {
      throw new Error(`Allocation with ID ${allocationId} not found`)
    }

    // Get effective price
    const pricePerDay = await getEffectivePrice(allocation.bedId)

    // Calculate pending fees
    const pendingDays = calculatePendingDays(allocation.paidUntil, currentDate, allocation.allocationDate)
    const pendingAmount = calculatePendingAmount(pendingDays, pricePerDay)

    // Create warning if pending amount > 0
    if (pendingAmount > 0) {
      return {
        hasWarning: true,
        pendingAmount,
        message: `Student has pending fees of ${pendingAmount.toFixed(2)} for ${pendingDays} day(s). This amount will remain on record.`,
      }
    }

    // No warning
    return {
      hasWarning: false,
      pendingAmount: 0,
      message: 'No pending fees.',
    }
  } catch (error) {
    console.error('Error checking deallocation warning:', error)
    throw error
  }
}

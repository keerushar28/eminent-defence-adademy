'use server'

import { PrismaClient } from '@prisma/client'
import {
  Payment,
  CreatePaymentInput,
  ListPaymentsParams,
  PaginationInfo,
  BedStatus,
} from '../types/hostel.types'
import {
  validateCreatePayment,
  checkAllocationExists,
} from '../lib/validation'
import {
  calculateNewPaidUntil,
} from '../lib/calculations'
import { getEffectivePrice } from './bed-actions'

const prisma = new PrismaClient()

/**
 * Convert Prisma Decimal fields to numbers for client components
 */
function convertPaymentToClient(payment: Record<string, unknown>): Payment {
  const alloc = payment.allocation as Record<string, unknown> | undefined
  const bed = alloc?.bed as Record<string, unknown> | undefined
  const room = bed?.room as Record<string, unknown> | undefined
  
  return {
    id: payment.id as string,
    allocationId: payment.allocationId as string,
    amount: payment.amount ? Number(payment.amount) : 0,
    paymentDate: payment.paymentDate as Date,
    daysPurchased: payment.daysPurchased as number,
    updatedPaidUntil: payment.updatedPaidUntil as Date,
    paymentMethod: payment.paymentMethod as string,
    referenceNumber: payment.referenceNumber as string | undefined,
    notes: payment.notes as string | undefined,
    createdBy: payment.createdBy as string,
    createdAt: payment.createdAt as Date,
    allocation: alloc ? {
      id: alloc.id as string,
      studentId: alloc.studentId as string,
      roomId: alloc.roomId as string,
      bedId: alloc.bedId as string,
      allocationDate: alloc.allocationDate as Date,
      paidUntil: alloc.paidUntil as Date,
      creditBalance: alloc.creditBalance ? Number(alloc.creditBalance) : 0,
      isActive: alloc.isActive as boolean,
      notes: alloc.notes as string | undefined,
      createdAt: alloc.createdAt as Date,
      updatedAt: alloc.updatedAt as Date,
      bed: bed ? {
        id: bed.id as string,
        roomId: bed.roomId as string,
        bedNumber: bed.bedNumber as string,
        pricePerDay: bed.pricePerDay ? Number(bed.pricePerDay) : 0,
        status: bed.status as BedStatus,
        isActive: bed.isActive as boolean,
        createdAt: bed.createdAt as Date,
        updatedAt: bed.updatedAt as Date,
        room: room ? {
          id: room.id as string,
          roomNumber: room.roomNumber as string,
          capacity: room.capacity as number,
          description: room.description as string | undefined,
          isActive: room.isActive as boolean,
          createdAt: room.createdAt as Date,
          updatedAt: room.updatedAt as Date,
        } : undefined,
      } : undefined,
    } : undefined,
  }
}

/**
 * Record a payment for an allocation
 * Calculates: days purchased, updated paid until date, credit balance
 * Validates: allocation exists, amount > 0
 * Updates: allocation paidUntil date and creditBalance
 * 
 * Logic:
 * - Add existing creditBalance to payment amount
 * - Calculate full days purchased
 * - Store leftover amount as new creditBalance
 * 
 * Example: Price = NPR 500/day, creditBalance = NPR 200, payment = NPR 700
 * - Total available = NPR 200 + NPR 700 = NPR 900
 * - Days purchased = floor(900/500) = 1 day
 * - New creditBalance = 900 - (1 × 500) = NPR 400
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.6
 * 
 * @param data - Payment creation data
 * @returns Created payment with converted Decimal fields
 * @throws Error if validation fails
 */
export async function createPayment(data: CreatePaymentInput): Promise<Payment> {
  try {
    // Validate input data
    const validation = validateCreatePayment(data)
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    // Check if allocation exists
    const allocationExists = await checkAllocationExists(data.allocationId)
    if (!allocationExists) {
      throw new Error(`Allocation with ID ${data.allocationId} not found`)
    }

    // Get allocation details
    const allocation = await prisma.hostelAllocation.findUnique({
      where: { id: data.allocationId },
      include: {
        bed: {
          include: {
            room: true,
          },
        },
      },
    })

    if (!allocation) {
      throw new Error(`Allocation with ID ${data.allocationId} not found`)
    }

    // Get effective price for the bed
    const pricePerDay = await getEffectivePrice(allocation.bedId)

    // Get current credit balance
    const currentCreditBalance = Number(allocation.creditBalance) || 0

    // Calculate total available amount (payment + existing credit)
    const totalAvailable = data.amount + currentCreditBalance

    // Calculate full days that can be purchased
    const daysPurchased = Math.floor(totalAvailable / pricePerDay)

    // Calculate new credit balance (leftover amount)
    const newCreditBalance = totalAvailable - (daysPurchased * pricePerDay)

    // Calculate new paid until date
    const updatedPaidUntil = calculateNewPaidUntil(allocation.paidUntil, daysPurchased)

    // Create payment and update allocation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the payment record
      const payment = await tx.hostelPayment.create({
        data: {
          allocationId: data.allocationId,
          amount: data.amount,
          paymentDate: data.paymentDate,
          daysPurchased,
          updatedPaidUntil,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber,
          notes: data.notes,
          createdBy: data.createdBy,
        },
        include: {
          allocation: {
            include: {
              student: true,
              bed: {
                include: {
                  room: true,
                },
              },
            },
          },
        },
      })

      // Update allocation paidUntil date and creditBalance
      await tx.hostelAllocation.update({
        where: { id: data.allocationId },
        data: { 
          paidUntil: updatedPaidUntil,
          creditBalance: newCreditBalance,
        },
      })

      return payment
    })

    return convertPaymentToClient(result)
  } catch (error) {
    console.error('Error creating payment:', error)
    throw error
  }
}

/**
 * Get payment by ID
 * 
 * Requirements: 5.7
 * 
 * @param paymentId - ID of the payment
 * @returns Payment with converted Decimal fields or null if not found
 */
export async function getPaymentById(paymentId: string): Promise<Payment | null> {
  try {
    const payment = await prisma.hostelPayment.findUnique({
      where: { id: paymentId },
      include: {
        allocation: {
          include: {
            student: true,
            bed: {
              include: {
                room: true,
              },
            },
          },
        },
      },
    })

    if (!payment) {
      return null
    }

    return convertPaymentToClient(payment)
  } catch (error) {
    console.error('Error getting payment by ID:', error)
    throw error
  }
}

/**
 * Get payment history for an allocation
 * Returns all payments for the allocation, ordered by payment date (most recent first)
 * Ensures payment history is accessible for deallocated allocations
 * 
 * Requirements: 5.5, 5.7, 7.3
 * 
 * @param allocationId - ID of the allocation
 * @returns Array of payments with converted Decimal fields
 */
export async function getPaymentHistory(allocationId: string): Promise<Payment[]> {
  try {
    const payments = await prisma.hostelPayment.findMany({
      where: { allocationId },
      include: {
        allocation: {
          include: {
            student: true,
            bed: {
              include: {
                room: true,
              },
            },
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    })

    return payments.map(convertPaymentToClient)
  } catch (error) {
    console.error('Error getting payment history:', error)
    throw error
  }
}

/**
 * List all payments with filters and pagination
 * Supports filtering by student, allocation, and date range
 * 
 * Requirements: 5.7, 7.3
 * 
 * @param params - Pagination and filter parameters
 * @returns Object containing payments array and pagination info
 */
export async function listPayments(params: ListPaymentsParams = {}): Promise<{
  payments: Payment[]
  pagination: PaginationInfo
}> {
  try {
    const {
      page = 1,
      limit = 10,
      studentId,
      allocationId,
      startDate,
      endDate,
    } = params

    // Build where clause
    const where: Record<string, unknown> = {}

    if (allocationId) {
      where.allocationId = allocationId
    }

    if (studentId) {
      where.allocation = {
        studentId,
      }
    }

    // Date range filter
    if (startDate || endDate) {
      const dateFilter: Record<string, unknown> = {}
      if (startDate) {
        dateFilter.gte = startDate
      }
      if (endDate) {
        dateFilter.lte = endDate
      }
      where.paymentDate = dateFilter
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get total count
    const total = await prisma.hostelPayment.count({ where })

    // Get payments
    const payments = await prisma.hostelPayment.findMany({
      where,
      skip,
      take: limit,
      include: {
        allocation: {
          include: {
            student: true,
            bed: {
              include: {
                room: true,
              },
            },
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    })

    // Convert payments to client format
    const convertedPayments = payments.map(convertPaymentToClient)

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit)

    return {
      payments: convertedPayments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Error listing payments:', error)
    throw error
  }
}

'use server'

import { PrismaClient, Prisma } from '@prisma/client'
import {
  Allocation,
  CreateAllocationInput,
  ListAllocationsParams,
  PaginationInfo,
  DeallocationWarning,
  BedStatus,
} from '../types/hostel.types'
import {
  validateCreateAllocation,
  checkStudentExists,
  checkBedExists,
  checkStudentActiveAllocation,
  checkBedAvailability,
} from '../lib/validation'
import {
  calculatePendingDays,
  calculatePendingAmount,
} from '../lib/calculations'
import { getEffectivePrice } from './bed-actions'

const prisma = new PrismaClient()

/**
 * Convert Prisma Decimal fields to numbers for client components
 */
function convertAllocationToClient(allocation: Record<string, unknown>): Allocation {
  const bed = allocation.bed as Record<string, unknown> | undefined
  const bedRoom = bed?.room as Record<string, unknown> | undefined
  const student = allocation.student as Record<string, unknown> | undefined
  
  return {
    id: allocation.id as string,
    studentId: allocation.studentId as string,
    roomId: allocation.roomId as string,
    bedId: allocation.bedId as string,
    allocationDate: allocation.allocationDate as Date,
    deallocationDate: allocation.deallocationDate as Date | undefined,
    paidUntil: allocation.paidUntil as Date,
    creditBalance: allocation.creditBalance ? Number(allocation.creditBalance) : 0,
    isActive: allocation.isActive as boolean,
    notes: allocation.notes as string | undefined,
    createdAt: allocation.createdAt as Date,
    updatedAt: allocation.updatedAt as Date,
    student: student ? {
      id: student.id as string,
      fullname: student.fullname as string,
      email: student.email as string,
      contact_number_student: student.contact_number_student as string,
      student_image: student.student_image as string,
    } : undefined,
    bed: bed ? {
      id: bed.id as string,
      roomId: bed.roomId as string,
      bedNumber: bed.bedNumber as string,
      pricePerDay: bed.pricePerDay ? Number(bed.pricePerDay) : 0,
      status: bed.status as BedStatus,
      isActive: bed.isActive as boolean,
      createdAt: bed.createdAt as Date,
      updatedAt: bed.updatedAt as Date,
      room: bedRoom ? {
        id: bedRoom.id as string,
        roomNumber: bedRoom.roomNumber as string,
        capacity: bedRoom.capacity as number,
        description: bedRoom.description as string | undefined,
        isActive: bedRoom.isActive as boolean,
        createdAt: bedRoom.createdAt as Date,
        updatedAt: bedRoom.updatedAt as Date,
      } : undefined,
    } : undefined,
    payments: (allocation.payments as Record<string, unknown>[])?.map((payment) => ({
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
      updatedAt: payment.updatedAt as Date,
    })),
  }
}

/**
 * Allocate a student to a bed
 * Validates: student exists, no active allocation, bed is available
 * Updates: bed status to ALLOCATED
 * Creates initial payment record if provided
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 8.3, 8.5
 * 
 * @param data - Allocation creation data
 * @returns Created allocation with converted Decimal fields
 * @throws Error if validation fails
 */
export async function allocateStudent(
  data: CreateAllocationInput & {
    initialPayment?: number
    paymentMethod?: string
    createdBy?: string
  }
): Promise<Allocation> {
  try {
    // Validate input data
    const validation = validateCreateAllocation(data)
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    // Check if student exists
    const studentExists = await checkStudentExists(data.studentId)
    if (!studentExists) {
      throw new Error(`Student with ID ${data.studentId} not found`)
    }

    // Check if student already has an active allocation
    const hasActiveAllocation = await checkStudentActiveAllocation(data.studentId)
    if (hasActiveAllocation) {
      throw new Error('Student already has an active allocation. Please deallocate the student first.')
    }

    // Check if bed exists
    const bedExists = await checkBedExists(data.bedId)
    if (!bedExists) {
      throw new Error(`Bed with ID ${data.bedId} not found`)
    }

    // Check if bed is available
    const isBedAvailable = await checkBedAvailability(data.bedId)
    if (!isBedAvailable) {
      throw new Error('Bed is not available for allocation')
    }

    // Get bed details to retrieve roomId
    const bed = await prisma.hostelBed.findUnique({
      where: { id: data.bedId },
    })

    if (!bed) {
      throw new Error(`Bed with ID ${data.bedId} not found`)
    }

    // Create allocation and update bed status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the allocation
      const allocation = await tx.hostelAllocation.create({
        data: {
          studentId: data.studentId,
          roomId: bed.roomId,
          bedId: data.bedId,
          allocationDate: data.allocationDate,
          paidUntil: data.paidUntil,
          notes: data.notes,
          isActive: true,
        },
        include: {
          student: {
            select: {
              id: true,
              fullname: true,
              email: true,
              contact_number_student: true,
              student_image: true,
            },
          },
          bed: {
            include: {
              room: true,
            },
          },
        },
      })

      // Update bed status to ALLOCATED
      await tx.hostelBed.update({
        where: { id: data.bedId },
        data: { status: BedStatus.ALLOCATED },
      })

      // Create initial payment record if provided
      if (data.initialPayment && data.initialPayment > 0) {
        const effectivePrice = await getEffectivePrice(data.bedId)
        
        // Calculate full days that can be purchased
        const daysPurchased = Math.floor(data.initialPayment / effectivePrice)
        
        // Calculate credit balance (leftover amount)
        const creditBalance = data.initialPayment - (daysPurchased * effectivePrice)
        
        // Calculate updated paidUntil date
        const updatedPaidUntil = new Date(data.paidUntil)
        updatedPaidUntil.setDate(updatedPaidUntil.getDate() + daysPurchased)

        await tx.hostelPayment.create({
          data: {
            allocationId: allocation.id,
            amount: new Prisma.Decimal(data.initialPayment),
            paymentDate: data.allocationDate,
            daysPurchased,
            updatedPaidUntil,
            paymentMethod: ((data.paymentMethod as string) || 'CASH') as 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE' | 'CARD',
            notes: 'Initial payment at allocation',
            createdBy: data.createdBy || 'system',
          },
        })

        // Update allocation's paidUntil date and creditBalance
        await tx.hostelAllocation.update({
          where: { id: allocation.id },
          data: { 
            paidUntil: updatedPaidUntil,
            creditBalance: new Prisma.Decimal(creditBalance),
          },
        })
      }

      return allocation
    })

    return convertAllocationToClient(result)
  } catch (error) {
    console.error('Error allocating student:', error)
    throw error
  }
}

/**
 * Deallocate a student from a bed
 * Sets isActive to false, stores deallocation date, updates bed status to AVAILABLE
 * Integrates with billing calculations to check for pending fees and return warning
 * Maintains all allocation and payment data after deallocation
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 * 
 * @param allocationId - ID of the allocation to deallocate
 * @returns Object containing updated allocation and optional warning
 * @throws Error if allocation not found or not active
 */
export async function deallocateStudent(allocationId: string, deallocationDate?: Date): Promise<{
  allocation: Allocation;
  warning?: DeallocationWarning;
}> {
  try {
    // Check if allocation exists
    const existingAllocation = await prisma.hostelAllocation.findUnique({
      where: { id: allocationId },
      include: {
        bed: {
          include: {
            room: true,
          },
        },
      },
    })

    if (!existingAllocation) {
      throw new Error(`Allocation with ID ${allocationId} not found`)
    }

    // Check if allocation is active
    if (!existingAllocation.isActive) {
      throw new Error('Allocation is already deallocated')
    }

    // Calculate pending fees for warning
    const currentDate = deallocationDate || new Date()
    const effectivePrice = await getEffectivePrice(existingAllocation.bedId)
    const pendingDays = calculatePendingDays(existingAllocation.paidUntil, currentDate, existingAllocation.allocationDate)
    const pendingAmount = calculatePendingAmount(pendingDays, effectivePrice)

    // Create warning if pending fees exist
    let warning: DeallocationWarning | undefined
    if (pendingAmount > 0) {
      warning = {
        hasWarning: true,
        pendingAmount,
        message: `Student has pending fees of ${pendingAmount.toFixed(2)} for ${pendingDays} day(s). This amount will remain on record.`,
      }
    }

    // Deallocate and update bed status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update allocation to inactive with deallocation date
      const allocation = await tx.hostelAllocation.update({
        where: { id: allocationId },
        data: {
          isActive: false,
          deallocationDate: currentDate,
        },
        include: {
          student: {
            select: {
              id: true,
              fullname: true,
              email: true,
              contact_number_student: true,
              student_image: true,
            },
          },
          bed: {
            include: {
              room: true,
            },
          },
          payments: true,
        },
      })

      // Update bed status to AVAILABLE
      await tx.hostelBed.update({
        where: { id: existingAllocation.bedId },
        data: { status: BedStatus.AVAILABLE },
      })

      return allocation
    })

    return {
      allocation: convertAllocationToClient(result),
      warning,
    }
  } catch (error) {
    console.error('Error deallocating student:', error)
    throw error
  }
}

/**
 * Get active allocation for a student
 * 
 * Requirements: 3.6
 * 
 * @param studentId - ID of the student
 * @returns Active allocation with converted Decimal fields or null if not found
 */
export async function getActiveAllocation(studentId: string): Promise<Allocation | null> {
  try {
    const allocation = await prisma.hostelAllocation.findFirst({
      where: {
        studentId,
        isActive: true,
      },
      include: {
        student: {
          select: {
            id: true,
            fullname: true,
            email: true,
            contact_number_student: true,
            student_image: true,
          },
        },
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
    })

    if (!allocation) {
      return null
    }

    return convertAllocationToClient(allocation)
  } catch (error) {
    console.error('Error getting active allocation:', error)
    throw error
  }
}

/**
 * Get allocation by ID with full details
 * 
 * Requirements: 3.6
 * 
 * @param allocationId - ID of the allocation
 * @returns Allocation with converted Decimal fields or null if not found
 */
export async function getAllocationById(allocationId: string): Promise<Allocation | null> {
  try {
    const allocation = await prisma.hostelAllocation.findUnique({
      where: { id: allocationId },
      include: {
        student: {
          select: {
            id: true,
            fullname: true,
            email: true,
            contact_number_student: true,
            student_image: true,
          },
        },
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
    })

    if (!allocation) {
      return null
    }

    return convertAllocationToClient(allocation)
  } catch (error) {
    console.error('Error getting allocation by ID:', error)
    throw error
  }
}

/**
 * List all allocations with filters and pagination
 * Includes both active and inactive allocations based on filter
 * 
 * Requirements: 3.7, 7.1, 7.7
 * 
 * @param params - Pagination and filter parameters
 * @returns Object containing allocations array and pagination info
 */
export async function listAllocations(params: ListAllocationsParams = {}): Promise<{
  allocations: Allocation[]
  pagination: PaginationInfo
}> {
  try {
    const {
      page = 1,
      limit = 10,
      studentId,
      roomId,
      isActive,
    } = params

    // Build where clause
    const where: Record<string, unknown> = {}

    if (studentId) {
      where.studentId = studentId
    }

    if (roomId) {
      where.roomId = roomId
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get total count
    const total = await prisma.hostelAllocation.count({ where })

    // Get allocations
    const allocations = await prisma.hostelAllocation.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: {
          select: {
            id: true,
            fullname: true,
            email: true,
            contact_number_student: true,
            student_image: true,
          },
        },
        bed: {
          include: {
            room: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
          take: 5, // Limit to recent 5 payments for list view
        },
      },
      orderBy: [
        { isActive: 'desc' }, // Active allocations first
        { allocationDate: 'desc' },
      ],
    })

    // Convert allocations to client format
    const convertedAllocations = allocations.map(convertAllocationToClient)

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit)

    return {
      allocations: convertedAllocations,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Error listing allocations:', error)
    throw error
  }
}

/**
 * Get allocation history for a student
 * Returns all allocations (active and inactive) for the student
 * 
 * Requirements: 3.7, 7.1, 7.7
 * 
 * @param studentId - ID of the student
 * @returns Array of all allocations with converted Decimal fields
 */
export async function getAllocationHistory(studentId: string): Promise<Allocation[]> {
  try {
    const allocations = await prisma.hostelAllocation.findMany({
      where: { studentId },
      include: {
        student: {
          select: {
            id: true,
            fullname: true,
            email: true,
            contact_number_student: true,
            student_image: true,
          },
        },
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
        { isActive: 'desc' }, // Active allocations first
        { allocationDate: 'desc' },
      ],
    })

    return allocations.map(convertAllocationToClient)
  } catch (error) {
    console.error('Error getting allocation history:', error)
    throw error
  }
}

/**
 * Delete an allocation permanently
 * Also frees the bed if the allocation was active
 */
export async function deleteAllocation(allocationId: string): Promise<void> {
  const existing = await prisma.hostelAllocation.findUnique({
    where: { id: allocationId },
  })

  if (!existing) {
    throw new Error(`Allocation with ID ${allocationId} not found`)
  }

  await prisma.$transaction(async (tx) => {
    // Delete related payments first
    await tx.hostelPayment.deleteMany({ where: { allocationId } })

    // Delete the allocation
    await tx.hostelAllocation.delete({ where: { id: allocationId } })

    // If it was active, free the bed
    if (existing.isActive) {
      await tx.hostelBed.update({
        where: { id: existing.bedId },
        data: { status: BedStatus.AVAILABLE },
      })
    }
  })
}

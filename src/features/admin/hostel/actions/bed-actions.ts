'use server'

import { PrismaClient, Prisma } from '@prisma/client'
import {
  Bed,
  CreateBedInput,
  UpdateBedInput,
  BedStatus,
} from '../types/hostel.types'
import {
  validateCreateBed,
  checkRoomExists,
  checkBedNumberUniqueInRoom,
  checkBedNumberUniqueInRoomForUpdate,
  checkRoomCapacity,
  checkBedDeletable,
  checkBedExists,
} from '../lib/validation'

const prisma = new PrismaClient()

/**
 * Convert Prisma Decimal fields to numbers for client components
 */
function convertBedToClient(bed: Record<string, unknown>): Bed {
  const bedRoom = bed.room as Record<string, unknown> | undefined
  
  return {
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
  }
}

/**
 * Create a new bed in a room
 * Validates: room exists, bed number unique within room, capacity not exceeded
 * Uses room default price when bed-specific price not provided
 * 
 * Requirements: 2.1, 2.3, 8.2, 8.4
 * 
 * @param data - Bed creation data
 * @returns Created bed with converted Decimal fields
 * @throws Error if validation fails
 */
export async function createBed(data: CreateBedInput): Promise<Bed> {
  try {
    // Validate input data
    const validation = validateCreateBed(data)
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    // Check if room exists
    const roomExists = await checkRoomExists(data.roomId)
    if (!roomExists) {
      throw new Error(`Room with ID ${data.roomId} not found`)
    }

    // Check if bed number is unique within the room
    const isUnique = await checkBedNumberUniqueInRoom(data.roomId, data.bedNumber)
    if (!isUnique) {
      throw new Error(`Bed number ${data.bedNumber} already exists in this room`)
    }

    // Check if room capacity allows new bed
    const hasCapacity = await checkRoomCapacity(data.roomId)
    if (!hasCapacity) {
      throw new Error('Room capacity exceeded. Cannot add more beds to this room.')
    }

    // Create the bed
    const bed = await prisma.hostelBed.create({
      data: {
        roomId: data.roomId,
        bedNumber: data.bedNumber,
        pricePerDay: new Prisma.Decimal(data.pricePerDay),
        status: BedStatus.AVAILABLE,
      },
      include: {
        room: true,
      },
    })

    return convertBedToClient(bed)
  } catch (error) {
    console.error('Error creating bed:', error)
    throw error
  }
}

/**
 * Update bed details
 * Validates: bed exists, status change rules
 * Prevents updating status to ALLOCATED through direct bed update
 * Prevents updating status to AVAILABLE when active allocation exists
 * 
 * Requirements: 2.2, 8.6, 8.7
 * 
 * @param bedId - ID of the bed to update
 * @param data - Bed update data
 * @returns Updated bed with converted Decimal fields
 * @throws Error if bed not found or validation fails
 */
export async function updateBed(bedId: string, data: UpdateBedInput): Promise<Bed> {
  try {
    // Check if bed exists
    const existingBed = await prisma.hostelBed.findUnique({
      where: { id: bedId },
      include: {
        allocations: {
          where: { isActive: true },
        },
      },
    })

    if (!existingBed) {
      throw new Error(`Bed with ID ${bedId} not found`)
    }

    // If bed number is being changed, check uniqueness within the room
    if (data.bedNumber && data.bedNumber !== existingBed.bedNumber) {
      const isUnique = await checkBedNumberUniqueInRoomForUpdate(
        existingBed.roomId,
        data.bedNumber,
        bedId
      )
      if (!isUnique) {
        throw new Error(`Bed number ${data.bedNumber} already exists in this room`)
      }
    }

    // Validate status change rules
    if (data.status !== undefined) {
      // Prevent updating status to ALLOCATED through direct bed update
      if (data.status === BedStatus.ALLOCATED) {
        throw new Error('Cannot set bed status to ALLOCATED directly. Use allocation creation instead.')
      }

      // Prevent updating status to AVAILABLE when active allocation exists
      if (data.status === BedStatus.AVAILABLE && existingBed.allocations.length > 0) {
        throw new Error('Cannot set bed status to AVAILABLE. An active allocation exists for this bed.')
      }
    }

    // Validate price per day if provided
    if (data.pricePerDay !== undefined && data.pricePerDay !== null) {
      if (data.pricePerDay <= 0) {
        throw new Error('Price per day must be greater than 0')
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (data.bedNumber !== undefined) updateData.bedNumber = data.bedNumber
    if (data.pricePerDay !== undefined && data.pricePerDay !== null) {
      updateData.pricePerDay = new Prisma.Decimal(data.pricePerDay)
    }
    if (data.status !== undefined) updateData.status = data.status
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    // Update the bed
    const bed = await prisma.hostelBed.update({
      where: { id: bedId },
      data: updateData,
      include: {
        room: true,
      },
    })

    return convertBedToClient(bed)
  } catch (error) {
    console.error('Error updating bed:', error)
    throw error
  }
}

/**
 * Delete a bed
 * Validates: bed status is not ALLOCATED
 * 
 * Requirements: 2.5, 2.6
 * 
 * @param bedId - ID of the bed to delete
 * @throws Error if bed not found or has ALLOCATED status
 */
export async function deleteBed(bedId: string): Promise<void> {
  try {
    // Check if bed exists
    const bedExists = await checkBedExists(bedId)
    if (!bedExists) {
      throw new Error(`Bed with ID ${bedId} not found`)
    }

    // Check if bed can be deleted (status is not ALLOCATED)
    const isDeletable = await checkBedDeletable(bedId)
    if (!isDeletable) {
      throw new Error('Cannot delete bed: bed is currently allocated. Please deallocate the student first.')
    }

    // Delete the bed
    await prisma.hostelBed.delete({
      where: { id: bedId },
    })
  } catch (error) {
    console.error('Error deleting bed:', error)
    throw error
  }
}

/**
 * Get bed by ID
 * 
 * Requirements: 2.7
 * 
 * @param bedId - ID of the bed to retrieve
 * @returns Bed with converted Decimal fields or null if not found
 */
export async function getBedById(bedId: string): Promise<Bed | null> {
  try {
    const bed = await prisma.hostelBed.findUnique({
      where: { id: bedId },
      include: {
        room: true,
      },
    })

    if (!bed) {
      return null
    }

    return convertBedToClient(bed)
  } catch (error) {
    console.error('Error getting bed by ID:', error)
    throw error
  }
}

/**
 * List beds by room
 * 
 * Requirements: 2.7
 * 
 * @param roomId - ID of the room
 * @returns Array of beds with converted Decimal fields
 */
export async function listBedsByRoom(roomId: string): Promise<Bed[]> {
  try {
    const beds = await prisma.hostelBed.findMany({
      where: { roomId },
      include: {
        room: true,
      },
      orderBy: {
        bedNumber: 'asc',
      },
    })

    return beds.map(convertBedToClient)
  } catch (error) {
    console.error('Error listing beds by room:', error)
    throw error
  }
}

/**
 * Get available beds
 * Optionally filter by room
 * 
 * Requirements: 2.8
 * 
 * @param roomId - Optional room ID to filter by
 * @returns Array of available beds with converted Decimal fields
 */
export async function getAvailableBeds(roomId?: string): Promise<Bed[]> {
  try {
    const where: Record<string, unknown> = {
      status: BedStatus.AVAILABLE,
      isActive: true,
    }

    if (roomId) {
      where.roomId = roomId
    }

    const beds = await prisma.hostelBed.findMany({
      where,
      include: {
        room: true,
      },
      orderBy: [
        { room: { roomNumber: 'asc' } },
        { bedNumber: 'asc' },
      ],
    })

    return beds.map(convertBedToClient)
  } catch (error) {
    console.error('Error getting available beds:', error)
    throw error
  }
}

/**
 * Get effective price for a bed
 * Returns the bed's price per day
 * 
 * Requirements: 2.4, 2.8
 * 
 * @param bedId - ID of the bed
 * @returns Price per day as a number
 * @throws Error if bed not found
 */
export async function getEffectivePrice(bedId: string): Promise<number> {
  try {
    const bed = await prisma.hostelBed.findUnique({
      where: { id: bedId },
      select: {
        pricePerDay: true,
      },
    })

    if (!bed) {
      throw new Error(`Bed with ID ${bedId} not found`)
    }

    return Number(bed.pricePerDay)
  } catch (error) {
    console.error('Error getting effective price:', error)
    throw error
  }
}

import { PrismaClient } from '@prisma/client'
import {
  CreateRoomInput,
  CreateBedInput,
  CreateAllocationInput,
  CreatePaymentInput,
  BedStatus,
} from '../types/hostel.types'

const prisma = new PrismaClient()

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Validate room creation data
 * Requirements: 1.1, 8.1
 */
export function validateCreateRoom(data: CreateRoomInput): ValidationResult {
  const errors: string[] = []

  // Validate room number
  if (!data.roomNumber || data.roomNumber.trim() === '') {
    errors.push('Room number is required')
  }

  // Validate capacity
  if (!data.capacity || data.capacity <= 0) {
    errors.push('Capacity must be greater than 0')
  }

  if (!Number.isInteger(data.capacity)) {
    errors.push('Capacity must be a whole number')
  }


  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate bed creation data
 * Requirements: 2.1, 8.2, 8.4
 */
export function validateCreateBed(data: CreateBedInput): ValidationResult {
  const errors: string[] = []

  // Validate room ID
  if (!data.roomId || data.roomId.trim() === '') {
    errors.push('Room ID is required')
  }

  // Validate bed number
  if (!data.bedNumber || data.bedNumber.trim() === '') {
    errors.push('Bed number is required')
  }

  // Validate price per day if provided
  if (data.pricePerDay !== undefined && data.pricePerDay !== null) {
    if (data.pricePerDay <= 0) {
      errors.push('Price per day must be greater than 0')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate allocation creation data
 * Requirements: 3.2, 3.3, 8.3, 8.5
 */
export function validateCreateAllocation(data: CreateAllocationInput): ValidationResult {
  const errors: string[] = []

  // Validate student ID
  if (!data.studentId || data.studentId.trim() === '') {
    errors.push('Student ID is required')
  }

  // Validate bed ID
  if (!data.bedId || data.bedId.trim() === '') {
    errors.push('Bed ID is required')
  }

  // Validate allocation date
  if (!data.allocationDate) {
    errors.push('Allocation date is required')
  } else if (!(data.allocationDate instanceof Date) || isNaN(data.allocationDate.getTime())) {
    errors.push('Allocation date must be a valid date')
  }

  // Validate paid until date
  if (!data.paidUntil) {
    errors.push('Paid until date is required')
  } else if (!(data.paidUntil instanceof Date) || isNaN(data.paidUntil.getTime())) {
    errors.push('Paid until date must be a valid date')
  }

  // Validate that paid until is not before allocation date
  if (data.allocationDate && data.paidUntil) {
    if (data.paidUntil < data.allocationDate) {
      errors.push('Paid until date cannot be before allocation date')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate payment creation data
 * Requirements: 5.6
 */
export function validateCreatePayment(data: CreatePaymentInput): ValidationResult {
  const errors: string[] = []

  // Validate allocation ID
  if (!data.allocationId || data.allocationId.trim() === '') {
    errors.push('Allocation ID is required')
  }

  // Validate amount
  if (data.amount === undefined || data.amount === null) {
    errors.push('Payment amount is required')
  } else if (data.amount <= 0) {
    errors.push('Payment amount must be greater than 0')
  }

  // Validate payment date
  if (!data.paymentDate) {
    errors.push('Payment date is required')
  } else if (!(data.paymentDate instanceof Date) || isNaN(data.paymentDate.getTime())) {
    errors.push('Payment date must be a valid date')
  }

  // Validate payment method
  if (!data.paymentMethod || data.paymentMethod.trim() === '') {
    errors.push('Payment method is required')
  }

  // Validate created by
  if (!data.createdBy || data.createdBy.trim() === '') {
    errors.push('Created by is required')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Check if student has an active allocation
 * Requirements: 3.2
 */
export async function checkStudentActiveAllocation(studentId: string): Promise<boolean> {
  try {
    const activeAllocation = await prisma.hostelAllocation.findFirst({
      where: {
        studentId,
        isActive: true,
      },
    })

    return activeAllocation !== null
  } catch (error) {
    console.error('Error checking student active allocation:', error)
    throw new Error('Failed to check student active allocation')
  }
}

/**
 * Check if bed is available
 * Requirements: 3.3
 */
export async function checkBedAvailability(bedId: string): Promise<boolean> {
  try {
    const bed = await prisma.hostelBed.findUnique({
      where: { id: bedId },
    })

    if (!bed) {
      throw new Error('Bed not found')
    }

    return bed.status === BedStatus.AVAILABLE
  } catch (error) {
    console.error('Error checking bed availability:', error)
    throw error
  }
}

/**
 * Check if room capacity allows new bed
 * Requirements: 8.2
 */
export async function checkRoomCapacity(roomId: string): Promise<boolean> {
  try {
    const room = await prisma.hostelRoom.findUnique({
      where: { id: roomId },
      include: {
        beds: {
          where: { isActive: true },
        },
      },
    })

    if (!room) {
      throw new Error('Room not found')
    }

    const currentBedCount = room.beds.length
    return currentBedCount < room.capacity
  } catch (error) {
    console.error('Error checking room capacity:', error)
    throw error
  }
}

/**
 * Check if bed can be deleted
 * Requirements: 8.6, 8.7
 */
export async function checkBedDeletable(bedId: string): Promise<boolean> {
  try {
    const bed = await prisma.hostelBed.findUnique({
      where: { id: bedId },
    })

    if (!bed) {
      throw new Error('Bed not found')
    }

    // Bed cannot be deleted if status is ALLOCATED
    return bed.status !== BedStatus.ALLOCATED
  } catch (error) {
    console.error('Error checking bed deletability:', error)
    throw error
  }
}

/**
 * Check if room can be deleted
 * Requirements: 1.5
 */
export async function checkRoomDeletable(roomId: string): Promise<boolean> {
  try {
    const room = await prisma.hostelRoom.findUnique({
      where: { id: roomId },
      include: {
        beds: true,
      },
    })

    if (!room) {
      throw new Error('Room not found')
    }

    // Room cannot be deleted if it has any beds
    return room.beds.length === 0
  } catch (error) {
    console.error('Error checking room deletability:', error)
    throw error
  }
}

/**
 * Check if room number is unique (for creation)
 * Requirements: 8.1
 */
export async function checkRoomNumberUnique(roomNumber: string): Promise<boolean> {
  try {
    const existingRoom = await prisma.hostelRoom.findUnique({
      where: { roomNumber },
    })

    return existingRoom === null
  } catch (error) {
    console.error('Error checking room number uniqueness:', error)
    throw new Error('Failed to check room number uniqueness')
  }
}

/**
 * Check if room number is unique for update (excluding current room)
 * Requirements: 8.1
 */
export async function checkRoomNumberUniqueForUpdate(
  roomNumber: string,
  currentRoomId: string
): Promise<boolean> {
  try {
    const existingRoom = await prisma.hostelRoom.findUnique({
      where: { roomNumber },
    })

    // If no room found, it's unique
    if (!existingRoom) {
      return true
    }

    // If found room is the current room, it's valid
    return existingRoom.id === currentRoomId
  } catch (error) {
    console.error('Error checking room number uniqueness for update:', error)
    throw new Error('Failed to check room number uniqueness')
  }
}

/**
 * Check if bed number is unique within a room
 * Requirements: 8.2
 */
export async function checkBedNumberUniqueInRoom(
  roomId: string,
  bedNumber: string
): Promise<boolean> {
  try {
    const existingBed = await prisma.hostelBed.findUnique({
      where: {
        roomId_bedNumber: {
          roomId,
          bedNumber,
        },
      },
    })

    return existingBed === null
  } catch (error) {
    console.error('Error checking bed number uniqueness in room:', error)
    throw new Error('Failed to check bed number uniqueness')
  }
}

/**
 * Check if bed number is unique within a room for update (excluding current bed)
 * Requirements: 8.2
 */
export async function checkBedNumberUniqueInRoomForUpdate(
  roomId: string,
  bedNumber: string,
  currentBedId: string
): Promise<boolean> {
  try {
    const existingBed = await prisma.hostelBed.findUnique({
      where: {
        roomId_bedNumber: {
          roomId,
          bedNumber,
        },
      },
    })

    // If no bed found, it's unique
    if (!existingBed) {
      return true
    }

    // If found bed is the current bed, it's valid
    return existingBed.id === currentBedId
  } catch (error) {
    console.error('Error checking bed number uniqueness in room for update:', error)
    throw new Error('Failed to check bed number uniqueness')
  }
}

/**
 * Check if student exists in the system
 * Requirements: 8.3
 */
export async function checkStudentExists(studentId: string): Promise<boolean> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    })

    return student !== null
  } catch (error) {
    console.error('Error checking student existence:', error)
    throw new Error('Failed to check student existence')
  }
}

/**
 * Check if room exists in the system
 * Requirements: 8.4
 */
export async function checkRoomExists(roomId: string): Promise<boolean> {
  try {
    const room = await prisma.hostelRoom.findUnique({
      where: { id: roomId },
    })

    return room !== null
  } catch (error) {
    console.error('Error checking room existence:', error)
    throw new Error('Failed to check room existence')
  }
}

/**
 * Check if bed exists in the system
 * Requirements: 8.5
 */
export async function checkBedExists(bedId: string): Promise<boolean> {
  try {
    const bed = await prisma.hostelBed.findUnique({
      where: { id: bedId },
    })

    return bed !== null
  } catch (error) {
    console.error('Error checking bed existence:', error)
    throw new Error('Failed to check bed existence')
  }
}

/**
 * Check if allocation exists in the system
 */
export async function checkAllocationExists(allocationId: string): Promise<boolean> {
  try {
    const allocation = await prisma.hostelAllocation.findUnique({
      where: { id: allocationId },
    })

    return allocation !== null
  } catch (error) {
    console.error('Error checking allocation existence:', error)
    throw new Error('Failed to check allocation existence')
  }
}

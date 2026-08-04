"use server";

import { PrismaClient } from "@prisma/client";
import {
  Room,
  CreateRoomInput,
  UpdateRoomInput,
  ListRoomsParams,
  PaginationInfo,
  BedStatus,
} from "../types/hostel.types";
import {
  validateCreateRoom,
  checkRoomNumberUnique,
  checkRoomNumberUniqueForUpdate,
  checkRoomDeletable,
} from "../lib/validation";

const prisma = new PrismaClient();

/**
 * Convert Prisma Decimal fields to numbers for client components
 */
function convertRoomToClient(room: Record<string, unknown>): Room {
  return {
    id: room.id as string,
    roomNumber: room.roomNumber as string,
    capacity: room.capacity as number,
    description: room.description as string | undefined,
    isActive: room.isActive as boolean,
    createdAt: room.createdAt as Date,
    updatedAt: room.updatedAt as Date,
    beds: (room.beds as Record<string, unknown>[])?.map((bed) => ({
      id: bed.id as string,
      roomId: bed.roomId as string,
      bedNumber: bed.bedNumber as string,
      pricePerDay: Number(bed.pricePerDay),
      status: bed.status as BedStatus,
      isActive: bed.isActive as boolean,
      createdAt: bed.createdAt as Date,
      updatedAt: bed.updatedAt as Date,
    })),
  };
}

/**
 * Create a new hostel room
 * Validates: unique room number
 *
 * Requirements: 1.1, 8.1
 *
 * @param data - Room creation data
 * @returns Created room with converted Decimal fields
 * @throws Error if validation fails or room number is not unique
 */
export async function createRoom(data: CreateRoomInput): Promise<Room> {
  try {
    // Validate input data
    const validation = validateCreateRoom(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // Check if room number is unique
    const isUnique = await checkRoomNumberUnique(data.roomNumber);
    if (!isUnique) {
      throw new Error(`Room number ${data.roomNumber} already exists`);
    }

    // Create the room
    const room = await prisma.hostelRoom.create({
      data: {
        roomNumber: data.roomNumber,
        capacity: data.capacity,
        description: data.description,
      },
    });

    return convertRoomToClient(room);
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
}

/**
 * Update existing room
 * Validates: room exists, room number uniqueness if changed
 *
 * Requirements: 1.2, 8.1
 *
 * @param roomId - ID of the room to update
 * @param data - Room update data
 * @returns Updated room with converted Decimal fields
 * @throws Error if room not found or validation fails
 */
export async function updateRoom(
  roomId: string,
  data: UpdateRoomInput
): Promise<Room> {
  try {
    // Check if room exists
    const existingRoom = await prisma.hostelRoom.findUnique({
      where: { id: roomId },
    });

    if (!existingRoom) {
      throw new Error(`Room with ID ${roomId} not found`);
    }

    // If room number is being changed, check uniqueness
    if (data.roomNumber && data.roomNumber !== existingRoom.roomNumber) {
      const isUnique = await checkRoomNumberUniqueForUpdate(
        data.roomNumber,
        roomId
      );
      if (!isUnique) {
        throw new Error(`Room number ${data.roomNumber} already exists`);
      }
    }

    // Validate capacity if provided
    if (data.capacity !== undefined) {
      if (data.capacity <= 0) {
        throw new Error("Capacity must be greater than 0");
      }
      if (!Number.isInteger(data.capacity)) {
        throw new Error("Capacity must be a whole number");
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.roomNumber !== undefined) updateData.roomNumber = data.roomNumber;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Update the room
    const room = await prisma.hostelRoom.update({
      where: { id: roomId },
      data: updateData,
    });

    return convertRoomToClient(room);
  } catch (error) {
    console.error("Error updating room:", error);
    throw error;
  }
}

/**
 * Delete a room
 * Validates: no beds exist in the room
 *
 * Requirements: 1.3, 1.5
 *
 * @param roomId - ID of the room to delete
 * @throws Error if room not found or has beds
 */
export async function deleteRoom(roomId: string): Promise<void> {
  try {
    // Check if room exists
    const existingRoom = await prisma.hostelRoom.findUnique({
      where: { id: roomId },
    });

    if (!existingRoom) {
      throw new Error(`Room with ID ${roomId} not found`);
    }

    // Check if room can be deleted (no beds exist)
    const isDeletable = await checkRoomDeletable(roomId);
    if (!isDeletable) {
      throw new Error(
        "Cannot delete room: beds exist in this room. Please delete all beds first."
      );
    }

    // Delete the room
    await prisma.hostelRoom.delete({
      where: { id: roomId },
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    throw error;
  }
}

/**
 * Get room by ID with optional bed details
 *
 * Requirements: 1.4
 *
 * @param roomId - ID of the room to retrieve
 * @param includeBeds - Whether to include bed details (default: false)
 * @returns Room with converted Decimal fields or null if not found
 */
export async function getRoomById(
  roomId: string,
  includeBeds: boolean = false
): Promise<Room | null> {
  try {
    const room = await prisma.hostelRoom.findUnique({
      where: { id: roomId },
      include: {
        beds: includeBeds,
      },
    });

    if (!room) {
      return null;
    }

    return convertRoomToClient(room);
  } catch (error) {
    console.error("Error getting room by ID:", error);
    throw error;
  }
}

/**
 * List all rooms with pagination and filters
 *
 * Requirements: 1.4
 *
 * @param params - Pagination and filter parameters
 * @returns Object containing rooms array and pagination info
 */
export async function listRooms(params: ListRoomsParams = {}): Promise<{
  rooms: Room[];
  pagination: PaginationInfo;
}> {
  try {
    const { page = 1, limit = 10, search, isActive } = params;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { roomNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await prisma.hostelRoom.count({ where });

    // Get rooms with beds count
    const rooms = await prisma.hostelRoom.findMany({
      where,
      skip,
      take: limit,
      include: {
        beds: {
          select: {
            id: true,
            bedNumber: true,
            pricePerDay: true,
            status: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        roomNumber: "asc",
      },
    });

    // Convert rooms to client format
    const convertedRooms = rooms.map(convertRoomToClient);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);

    return {
      rooms: convertedRooms,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Error listing rooms:", error);
    throw error;
  }
}

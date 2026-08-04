import { NextRequest, NextResponse } from 'next/server'
import { 
  getRoomById, 
  updateRoom, 
  deleteRoom 
} from '@/features/admin/hostel/actions/room-actions'
import { UpdateRoomInput } from '@/features/admin/hostel/types/hostel.types'

export const dynamic = 'force-dynamic'

/**
 * GET /api/hostel/rooms/:roomId
 * Retrieve a single room by ID
 * 
 * Query Parameters:
 * - includeBeds: boolean (optional, default: false)
 * 
 * Requirements: 1.4, 9.1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const searchParams = request.nextUrl.searchParams
    const includeBeds = searchParams.get('includeBeds') === 'true'

    const room = await getRoomById(roomId, includeBeds)

    if (!room) {
      return NextResponse.json(
        { 
          error: 'Room not found',
          message: `Room with ID ${roomId} not found`
        },
        { status: 404 }
      )
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error getting room:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get room',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/hostel/rooms/:roomId
 * Update an existing room
 * 
 * Request Body:
 * - roomNumber: string (optional)
 * - capacity: number (optional)
 * - description: string (optional)
 * - isActive: boolean (optional)
 * 
 * Requirements: 1.2, 9.1
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const body = await request.json()

    // Prepare update data
    const input: UpdateRoomInput = {}
    if (body.roomNumber !== undefined) input.roomNumber = body.roomNumber
    if (body.capacity !== undefined) input.capacity = body.capacity
    if (body.description !== undefined) input.description = body.description
    if (body.isActive !== undefined) input.isActive = body.isActive

    // Call service layer
    const room = await updateRoom(roomId, input)

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error updating room:', error)

    // Handle not found error
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'Room not found',
          message: error.message
        },
        { status: 404 }
      )
    }

    // Handle validation errors
    if (error instanceof Error && (
      error.message.includes('Validation failed') ||
      error.message.includes('must be')
    )) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          message: error.message
        },
        { status: 400 }
      )
    }

    // Handle duplicate room number
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { 
          error: 'Duplicate room number',
          message: error.message
        },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to update room',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/hostel/rooms/:roomId
 * Delete a room
 * 
 * Validates that no beds exist in the room before deletion
 * 
 * Requirements: 1.3, 1.5, 9.1
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params

    await deleteRoom(roomId)

    return NextResponse.json(
      { message: 'Room deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting room:', error)

    // Handle not found error
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'Room not found',
          message: error.message
        },
        { status: 404 }
      )
    }

    // Handle business logic errors (beds exist)
    if (error instanceof Error && error.message.includes('Cannot delete room')) {
      return NextResponse.json(
        { 
          error: 'Cannot delete room',
          message: error.message
        },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to delete room',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

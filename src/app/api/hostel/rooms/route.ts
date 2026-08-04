import { NextRequest, NextResponse } from 'next/server'
import { createRoom, listRooms } from '@/features/admin/hostel/actions/room-actions'
import { CreateRoomInput } from '@/features/admin/hostel/types/hostel.types'

export const dynamic = 'force-dynamic'

/**
 * GET /api/hostel/rooms
 * List all rooms with pagination and filters
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 10)
 * - search: string (optional)
 * - isActive: boolean (optional)
 * 
 * Requirements: 1.4, 9.1
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Parse filter parameters
    const search = searchParams.get('search') || undefined
    const isActiveParam = searchParams.get('isActive')
    const isActive = isActiveParam !== null ? isActiveParam === 'true' : undefined

    // Call service layer
    const result = await listRooms({
      page,
      limit,
      search,
      isActive,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error listing rooms:', error)
    return NextResponse.json(
      { 
        error: 'Failed to list rooms',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/hostel/rooms
 * Create a new hostel room
 * 
 * Request Body:
 * - roomNumber: string (required)
 * - capacity: number (required)
 * - description: string (optional)
 * 
 * Requirements: 1.1, 9.1
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.roomNumber || !body.capacity) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          message: 'Missing required fields: roomNumber, capacity'
        },
        { status: 400 }
      )
    }

    // Prepare input data
    const input: CreateRoomInput = {
      roomNumber: body.roomNumber,
      capacity: body.capacity,
      description: body.description,
    }

    // Call service layer
    const room = await createRoom(input)

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    
    // Handle validation errors
    if (error instanceof Error && error.message.includes('Validation failed')) {
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
        error: 'Failed to create room',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

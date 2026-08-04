import { NextRequest, NextResponse } from 'next/server'
import { createBed } from '@/features/admin/hostel/actions/bed-actions'
import { CreateBedInput } from '@/features/admin/hostel/types/hostel.types'

export const dynamic = 'force-dynamic'

/**
 * POST /api/hostel/beds
 * Create a new bed in a room
 * 
 * Request Body:
 * - roomId: string (required)
 * - bedNumber: string (required)
 * - pricePerDay: number (optional)
 * 
 * Requirements: 2.1, 9.1
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.roomId || !body.bedNumber) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          message: 'Missing required fields: roomId, bedNumber'
        },
        { status: 400 }
      )
    }

    // Prepare input data
    const input: CreateBedInput = {
      roomId: body.roomId,
      bedNumber: body.bedNumber,
      pricePerDay: body.pricePerDay,
    }

    // Call service layer
    const bed = await createBed(input)

    return NextResponse.json(bed, { status: 201 })
  } catch (error) {
    console.error('Error creating bed:', error)
    
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

    // Handle not found errors (room not found)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'Room not found',
          message: error.message
        },
        { status: 404 }
      )
    }

    // Handle duplicate bed number
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { 
          error: 'Duplicate bed number',
          message: error.message
        },
        { status: 422 }
      )
    }

    // Handle capacity exceeded
    if (error instanceof Error && error.message.includes('capacity exceeded')) {
      return NextResponse.json(
        { 
          error: 'Room capacity exceeded',
          message: error.message
        },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to create bed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

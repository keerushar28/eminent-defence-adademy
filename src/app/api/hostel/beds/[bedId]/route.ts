import { NextRequest, NextResponse } from 'next/server'
import { deleteBed, getBedById, updateBed } from '@/features/admin/hostel/actions/bed-actions'
import { UpdateBedInput } from '@/features/admin/hostel/types/hostel.types'

export const dynamic = 'force-dynamic'

/**
 * GET /api/hostel/beds/:bedId
 * Retrieve a single bed by ID
 * 
 * Requirements: 2.7, 9.1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bedId: string }> }
) {
  try {
    const { bedId } = await params

    const bed = await getBedById(bedId)

    if (!bed) {
      return NextResponse.json(
        { 
          error: 'Bed not found',
          message: `Bed with ID ${bedId} not found`
        },
        { status: 404 }
      )
    }

    return NextResponse.json(bed)
  } catch (error) {
    console.error('Error getting bed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get bed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/hostel/beds/:bedId
 * Update an existing bed
 * 
 * Request Body:
 * - bedNumber: string (optional)
 * - pricePerDay: number (optional)
 * - status: string (optional)
 * - isActive: boolean (optional)
 * 
 * Requirements: 2.2, 9.1
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bedId: string }> }
) {
  try {
    const { bedId } = await params
    const body = await request.json()

    // Prepare update data
    const input: UpdateBedInput = {}
    if (body.bedNumber !== undefined) input.bedNumber = body.bedNumber
    if (body.pricePerDay !== undefined) input.pricePerDay = body.pricePerDay
    if (body.status !== undefined) input.status = body.status
    if (body.isActive !== undefined) input.isActive = body.isActive

    // Call service layer
    const bed = await updateBed(bedId, input)

    return NextResponse.json(bed)
  } catch (error) {
    console.error('Error updating bed:', error)

    // Handle not found error
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'Bed not found',
          message: error.message
        },
        { status: 404 }
      )
    }

    // Handle validation errors
    if (error instanceof Error && (
      error.message.includes('Validation failed') ||
      error.message.includes('must be') ||
      error.message.includes('Cannot set bed status')
    )) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          message: error.message
        },
        { status: 400 }
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

    return NextResponse.json(
      { 
        error: 'Failed to update bed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/hostel/beds/:bedId
 * Delete a bed
 * 
 * Validates that the bed is not currently allocated before deletion
 * 
 * Requirements: 2.5, 2.6, 9.1
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bedId: string }> }
) {
  try {
    const { bedId } = await params

    await deleteBed(bedId)

    return NextResponse.json(
      { message: 'Bed deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting bed:', error)

    // Handle not found error
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'Bed not found',
          message: error.message
        },
        { status: 404 }
      )
    }

    // Handle business logic errors (bed is allocated)
    if (error instanceof Error && error.message.includes('Cannot delete bed')) {
      return NextResponse.json(
        { 
          error: 'Cannot delete bed',
          message: error.message
        },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to delete bed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

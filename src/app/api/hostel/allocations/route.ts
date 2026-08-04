import { NextRequest, NextResponse } from 'next/server'
import { allocateStudent, listAllocations } from '@/features/admin/hostel/actions/allocation-actions'
import { CreateAllocationInput } from '@/features/admin/hostel/types/hostel.types'

export const dynamic = 'force-dynamic'

/**
 * GET /api/hostel/allocations
 * List all allocations with pagination and filters
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 10)
 * - studentId: string (optional)
 * - roomId: string (optional)
 * - isActive: boolean (optional)
 * 
 * Requirements: 3.7, 9.1
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Parse filter parameters
    const studentId = searchParams.get('studentId') || undefined
    const roomId = searchParams.get('roomId') || undefined
    const isActiveParam = searchParams.get('isActive')
    const isActive = isActiveParam !== null ? isActiveParam === 'true' : undefined

    // Call service layer
    const result = await listAllocations({
      page,
      limit,
      studentId,
      roomId,
      isActive,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error listing allocations:', error)
    return NextResponse.json(
      { 
        error: 'Failed to list allocations',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/hostel/allocations
 * Create a new allocation (allocate student to bed)
 * 
 * Request Body:
 * - studentId: string (required)
 * - bedId: string (required)
 * - allocationDate: string (ISO date, required)
 * - paidUntil: string (ISO date, required)
 * - notes: string (optional)
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 9.1
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.studentId || !body.bedId || !body.allocationDate || !body.paidUntil) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          message: 'Missing required fields: studentId, bedId, allocationDate, paidUntil'
        },
        { status: 400 }
      )
    }

    // Prepare input data
    const input: CreateAllocationInput = {
      studentId: body.studentId,
      bedId: body.bedId,
      allocationDate: new Date(body.allocationDate),
      paidUntil: new Date(body.paidUntil),
      notes: body.notes,
    }

    // Call service layer
    const allocation = await allocateStudent(input)

    return NextResponse.json(allocation, { status: 201 })
  } catch (error) {
    console.error('Error creating allocation:', error)
    
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

    // Handle business logic errors
    if (error instanceof Error && (
      error.message.includes('not found') ||
      error.message.includes('already has an active allocation') ||
      error.message.includes('not available')
    )) {
      return NextResponse.json(
        { 
          error: 'Business logic error',
          message: error.message
        },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to create allocation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
